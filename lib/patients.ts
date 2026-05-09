import { prisma } from "@/lib/db";

/**
 * Hasta Dosyaları yardımcıları
 *
 * Schema'da Patient tablosu yok — telefon numarası natural key olarak
 * kullanılıyor. Aynı telefon = aynı hasta varsayımı.
 *
 * Hukuki açıdan kayıt tutma için:
 *   - Her randevu kaydı (createdAt = talep zamanı, approvedAt = onay zamanı)
 *   - SMS/WhatsApp log'ları (gönderim zamanı, içerik, kanal)
 *   - KVKK onayı verildiği an (kvkkConsentAt)
 *   - Reddetme sebepleri (rejectionReason)
 */

/**
 * Telefon numarasını normalize eder — sadece rakamlar.
 *
 *   "+90 532 111 22 33" → "905321112233"
 *   "0532 111 22 33"    → "905321112233"
 *   "5321112233"        → "905321112233"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `9${digits}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
}

/**
 * Display formatı — "0532 111 22 33"
 */
export function formatPhoneDisplay(phone: string): string {
  const norm = normalizePhone(phone);
  if (norm.length !== 12 || !norm.startsWith("90")) return phone;
  const local = norm.slice(2);
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
}

export interface PatientSummary {
  /** Normalize edilmiş telefon (key) */
  phoneKey: string;
  /** Display için formatlı telefon */
  phoneDisplay: string;
  /** En son kullanılan ad */
  latestName: string;
  /** Tanıdığımız tüm farklı isimler */
  allNames: string[];
  /** Toplam randevu sayısı */
  totalAppointments: number;
  /** Status sayıları */
  pendingCount: number;
  approvedCount: number;
  completedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  /** İlk talep tarihi */
  firstSeenAt: string;
  /** Son talep / etkinlik tarihi */
  lastSeenAt: string;
  /** En son kullanılan e-posta (varsa) */
  latestEmail: string | null;
}

/**
 * Tüm hastaları telefon bazlı gruplar — admin listesi için.
 */
export async function listPatients(): Promise<PatientSummary[]> {
  const appointments = await prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      patientName: true,
      patientPhone: true,
      patientEmail: true,
      status: true,
      createdAt: true,
      requestedAt: true,
      approvedAt: true,
    },
  });

  const map = new Map<string, PatientSummary>();

  for (const a of appointments) {
    const key = normalizePhone(a.patientPhone);
    if (!map.has(key)) {
      map.set(key, {
        phoneKey: key,
        phoneDisplay: formatPhoneDisplay(a.patientPhone),
        latestName: a.patientName,
        allNames: [a.patientName],
        totalAppointments: 0,
        pendingCount: 0,
        approvedCount: 0,
        completedCount: 0,
        rejectedCount: 0,
        cancelledCount: 0,
        firstSeenAt: a.createdAt.toISOString(),
        lastSeenAt: a.createdAt.toISOString(),
        latestEmail: a.patientEmail,
      });
    }

    const p = map.get(key)!;
    p.totalAppointments += 1;

    switch (a.status) {
      case "PENDING":   p.pendingCount += 1;   break;
      case "APPROVED":  p.approvedCount += 1;  break;
      case "COMPLETED": p.completedCount += 1; break;
      case "REJECTED":  p.rejectedCount += 1;  break;
      case "CANCELLED": p.cancelledCount += 1; break;
    }

    // En yeni isim/e-posta (orderBy desc olduğundan ilk gördüğümüz en yeni)
    if (!p.allNames.includes(a.patientName)) {
      p.allNames.push(a.patientName);
    }
    if (a.patientEmail && !p.latestEmail) {
      p.latestEmail = a.patientEmail;
    }

    // Tarih güncelle
    const ts = a.createdAt.toISOString();
    if (ts < p.firstSeenAt) p.firstSeenAt = ts;
    if (ts > p.lastSeenAt) p.lastSeenAt = ts;
  }

  // Liste, son aktiviteye göre azalan
  return Array.from(map.values()).sort((a, b) =>
    a.lastSeenAt < b.lastSeenAt ? 1 : -1
  );
}

/**
 * Tek bir hastanın tüm dosyası — randevular + mesajlar.
 */
export async function getPatientFile(phoneKey: string) {
  // Aynı normalize edilmiş telefona sahip tüm randevuları bul
  const allAppointments = await prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      service: true,
      dietician: true,
      smsLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const matched = allAppointments.filter(
    (a) => normalizePhone(a.patientPhone) === phoneKey
  );

  if (matched.length === 0) return null;

  const first = matched[matched.length - 1];

  // Tüm SMS log'larını uniq edip kronolojik sıralayalım
  const allLogs = matched
    .flatMap((a) => a.smsLogs.map((l) => ({ ...l, appointmentId: a.id })))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return {
    phoneKey,
    phoneDisplay: formatPhoneDisplay(first.patientPhone),
    latestName: matched[0].patientName,
    latestEmail: matched[0].patientEmail,
    allNames: Array.from(new Set(matched.map((a) => a.patientName))),
    appointments: matched.map((a) => ({
      id: a.id,
      patientName: a.patientName,
      patientPhone: a.patientPhone,
      patientEmail: a.patientEmail,
      patientNote: a.patientNote,
      serviceName: a.service.name,
      dieticianName: a.dietician
        ? `${a.dietician.title} ${a.dietician.fullName}`
        : null,
      requestedAt: a.requestedAt.toISOString(),
      status: a.status,
      approvedAt: a.approvedAt?.toISOString() ?? null,
      rejectionReason: a.rejectionReason,
      kvkkConsent: a.kvkkConsent,
      kvkkConsentAt: a.kvkkConsentAt?.toISOString() ?? null,
      source: a.source,
      ipAddress: a.ipAddress,
      createdAt: a.createdAt.toISOString(),
      messageCount: a.smsLogs.length,
    })),
    messages: allLogs.map((l) => ({
      id: l.id,
      appointmentId: l.appointmentId,
      provider: l.provider,
      message: l.message,
      status: l.status,
      providerMessageId: l.providerMessageId,
      errorMessage: l.errorMessage,
      sentAt: l.sentAt?.toISOString() ?? null,
      deliveredAt: l.deliveredAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    firstSeenAt: matched[matched.length - 1].createdAt.toISOString(),
    lastSeenAt: matched[0].createdAt.toISOString(),
  };
}
