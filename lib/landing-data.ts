/**
 * Landing page (anasayfa) için ortak tipler ve client-safe yardımcılar.
 *
 * Veritabanından çekme `lib/landing-data.server.ts` içindedir; bu dosya
 * client bileşenlerden de import edilebilir (sadece tipler ve saf
 * fonksiyonlar içerir).
 */

export interface LandingClinic {
  name: string;
  tagline: string | null;
  phone: string;
  whatsapp: string | null;
  email: string;
  address: string;
  city: string;
  district: string;
  workingHours: Record<string, { open?: string; close?: string; closed?: boolean }>;
}

export interface LandingDietician {
  fullName: string;
  title: string;
  specialty: string;
  bio: string;
  yearsOfExperience: number | null;
  licenseNumber: string | null;
}

/**
 * "0212 123 45 67" → "+902121234567" benzeri formata çevirir.
 * Sadece rakamlar kalır, başında 0 varsa +90 ile değiştirilir.
 */
export function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  return `+${digits}`;
}

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Pzt",
  tuesday: "Sal",
  wednesday: "Çar",
  thursday: "Per",
  friday: "Cum",
  saturday: "Cmt",
  sunday: "Paz",
};

/**
 * "Pzt-Cmt 09:00 - 19:00" gibi kısa bir özet üretir.
 * Tüm açık günler aynı saatte ise tek aralık döner; değilse "Detay ayarlardadır".
 */
export function summarizeWorkingHours(
  hours: LandingClinic["workingHours"]
): string {
  const open = DAY_ORDER.filter((d) => {
    const h = hours[d];
    return h && !h.closed && h.open && h.close;
  });

  if (open.length === 0) return "Çalışma saatleri belirtilmemiş";

  const first = hours[open[0]];
  const sameRange = open.every(
    (d) => hours[d].open === first.open && hours[d].close === first.close
  );

  const firstDay = DAY_LABELS[open[0]];
  const lastDay = DAY_LABELS[open[open.length - 1]];
  const dayRange = open.length === 1 ? firstDay : `${firstDay}-${lastDay}`;

  if (sameRange) {
    return `${dayRange} ${first.open} - ${first.close}`;
  }
  return `${dayRange} · Detay ayarlarda`;
}
