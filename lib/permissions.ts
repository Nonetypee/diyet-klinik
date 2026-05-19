/**
 * Rol & Yetki sistemi
 *
 * Üç rol var:
 *  - DEVELOPER : Anasayfa içeriği & renkler, kullanıcı yönetimi dahil tam yetki.
 *  - ADMIN     : Yönetici. Kullanıcı yönetimi + ayarlar + yedek; ANASAYFA İÇERİĞİ yok.
 *  - STAFF     : Yetkili. Sadece günlük operasyon (randevu, hasta, takvim).
 *
 * Geriye dönük uyumluluk: Önceki seed eski rol isimleriyle kullanıcı oluşturmuş
 * olabilir. Bunları yeni rollere eşliyoruz.
 */

export const ROLES = {
  DEVELOPER: "DEVELOPER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Eski rol isimlerini yeni sisteme eşler. */
export function normalizeRole(raw: string | null | undefined): Role {
  if (!raw) return ROLES.STAFF;
  const upper = raw.toUpperCase();
  // Yeni isimler
  if (upper === "DEVELOPER") return ROLES.DEVELOPER;
  if (upper === "ADMIN") return ROLES.ADMIN;
  if (upper === "STAFF") return ROLES.STAFF;
  // Eski isimler
  if (upper === "SUPER_ADMIN") return ROLES.DEVELOPER;
  if (upper === "DIETICIAN") return ROLES.ADMIN;
  if (upper === "SECRETARY") return ROLES.STAFF;
  return ROLES.STAFF;
}

/**
 * UI etiketleri — `DEVELOPER` rolü panelde tamamen gizlidir; bu yüzden
 * "Yönetici" gibi gösterilir. Developer hesapları zaten kullanıcı listesinde
 * de yer almaz.
 */
export const ROLE_LABELS: Record<Role, string> = {
  DEVELOPER: "Yönetici",
  ADMIN: "Yönetici",
  STAFF: "Yetkili",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  DEVELOPER:
    "Tüm sistem yetkilerine sahip yönetici hesabı.",
  ADMIN:
    "Kullanıcı yönetimi, ayarlar, yedekleme ve tüm randevu işlemleri.",
  STAFF:
    "Randevu, hasta dosyaları, takvim ve günlük operasyon.",
};

/**
 * Panelde kullanıcıya sunulan rol seçenekleri.
 * Developer rolü panelden ATANAMAZ — sadece .env üzerinden tanımlanır.
 */
export const ASSIGNABLE_ROLES: Role[] = [ROLES.ADMIN, ROLES.STAFF];

// =============================================================
// Yetki kapıları
// =============================================================

/** Anasayfa içeriği / renkleri düzenleme yetkisi var mı? */
export function canEditLanding(role: Role): boolean {
  return role === ROLES.DEVELOPER;
}

/** Kullanıcı yönetimi (ekle/sil/düzenle) yetkisi var mı? */
export function canManageUsers(role: Role): boolean {
  return role === ROLES.DEVELOPER || role === ROLES.ADMIN;
}

/** Klinik ayarları / mesajlaşma / yedekleme yetkisi var mı? */
export function canManageSettings(role: Role): boolean {
  return role === ROLES.DEVELOPER || role === ROLES.ADMIN;
}

/** Randevu işlemleri (onay/red, takvim, hasta) — herkes. */
export function canManageAppointments(_role: Role): boolean {
  return true;
}

/** Hizmet kataloğu düzenleme. */
export function canManageServices(role: Role): boolean {
  return role === ROLES.DEVELOPER || role === ROLES.ADMIN;
}

/** Yorum yönetimi. */
export function canManageTestimonials(role: Role): boolean {
  return role === ROLES.DEVELOPER || role === ROLES.ADMIN;
}

/** Yedekleme paneli. */
export function canManageBackups(role: Role): boolean {
  return role === ROLES.DEVELOPER || role === ROLES.ADMIN;
}
