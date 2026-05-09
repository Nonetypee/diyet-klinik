import { prisma } from "@/lib/db";

/**
 * Müsaitlik (availability) hesaplayıcı
 *
 * Kliniğin çalışma saatleri + mevcut PENDING/APPROVED randevular dikkate alınarak
 * verilen tarih için kullanılabilir slot listesi üretir.
 *
 * Özellikler:
 *   - Kapalı günler için isOpen: false döner
 *   - Geçmiş zamanlı slotlar otomatik "unavailable" işaretlenir
 *   - Üst üste binen randevular tespit edilir (servis süresine göre)
 *   - Slot aralığı varsayılan 30 dakika (slotInterval ile değiştirilebilir)
 */

export interface SlotInfo {
  /** "HH:MM" formatında */
  time: string;
  /** Tıklanabilir mi? */
  available: boolean;
  /** Müsait değilse sebep: BOOKED | PAST | OUTSIDE_HOURS */
  reason?: "BOOKED" | "PAST" | "OUTSIDE_HOURS";
}

export interface AvailabilityResult {
  /** ISO date "YYYY-MM-DD" */
  date: string;
  /** monday | tuesday | ... */
  dayKey: string;
  /** O gün klinik açık mı? */
  isOpen: boolean;
  /** Açıksa çalışma saatleri */
  workingHours: { open: string; close: string } | null;
  /** Gün kapalıysa açıklama */
  message?: string;
  /** Slotlar — boş array de dönebilir (kapalı gün) */
  slots: SlotInfo[];
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DAY_LABELS_TR: Record<string, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

interface WorkingHoursMap {
  [key: string]: DayHours;
}

function parseWorkingHours(json: string | null): WorkingHoursMap {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlotGrid(
  open: string,
  close: string,
  intervalMin: number
): string[] {
  const start = timeToMinutes(open);
  const end = timeToMinutes(close);
  const slots: string[] = [];
  for (let m = start; m + intervalMin <= end; m += intervalMin) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Belirli bir tarih için müsaitlik bilgisini döner.
 *
 * @param date — yerel saat dilimindeki gün (saatler 00:00:00 olmalı)
 * @param serviceDurationMin — randevu süresi (dakika)
 * @param slotInterval — slot aralığı (varsayılan 30 dk)
 */
export async function computeAvailability(args: {
  date: Date;
  serviceDurationMin: number;
  slotInterval?: number;
}): Promise<AvailabilityResult> {
  const { date, serviceDurationMin } = args;
  const slotInterval = args.slotInterval ?? 30;

  // Klinik bilgisi
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";
  const clinic = await prisma.clinic.findUnique({ where: { slug } });

  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
  const dayKey = DAY_KEYS[date.getDay()];

  if (!clinic) {
    return {
      date: isoDate,
      dayKey,
      isOpen: false,
      workingHours: null,
      message: "Klinik bulunamadı",
      slots: [],
    };
  }

  const hours = parseWorkingHours(clinic.workingHours);
  const dayHours = hours[dayKey];

  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return {
      date: isoDate,
      dayKey,
      isOpen: false,
      workingHours: null,
      message: `${DAY_LABELS_TR[dayKey] ?? dayKey} günleri kliniğimiz kapalı`,
      slots: [],
    };
  }

  // Slot grid üret
  const slotTimes = generateSlotGrid(dayHours.open, dayHours.close, slotInterval);

  // Mevcut randevular (PENDING + APPROVED)
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      requestedAt: { gte: dayStart, lte: dayEnd },
      status: { in: ["PENDING", "APPROVED"] },
    },
    include: { service: true },
  });

  const now = new Date();

  const slots: SlotInfo[] = slotTimes.map((time) => {
    const slotStart = combineDateTime(date, time);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDurationMin);

    // 1. Geçmişte mi?
    if (slotStart < now) {
      return { time, available: false, reason: "PAST" };
    }

    // 2. Çalışma saatleri dışında mı (slot bitişi close'u aşıyor mu)?
    const closeTime = combineDateTime(date, dayHours.close!);
    if (slotEnd > closeTime) {
      return { time, available: false, reason: "OUTSIDE_HOURS" };
    }

    // 3. Mevcut randevularla çakışma var mı?
    const conflict = existingAppointments.some((appt) => {
      const apptStart = appt.requestedAt;
      const apptEnd = new Date(apptStart);
      apptEnd.setMinutes(apptEnd.getMinutes() + appt.service.durationMin);
      return rangesOverlap(slotStart, slotEnd, apptStart, apptEnd);
    });

    if (conflict) {
      return { time, available: false, reason: "BOOKED" };
    }

    return { time, available: true };
  });

  return {
    date: isoDate,
    dayKey,
    isOpen: true,
    workingHours: { open: dayHours.open, close: dayHours.close },
    slots,
  };
}

/**
 * Çalışma saatleri haritasını döner — admin editor için.
 */
export async function getWorkingHours(): Promise<WorkingHoursMap> {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { workingHours: true },
  });
  return parseWorkingHours(clinic?.workingHours ?? null);
}
