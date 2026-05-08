/**
 * Modüler Mesajlaşma Sağlayıcı Arayüzü (SMS + WhatsApp)
 *
 * Bu arayüz, farklı sağlayıcıları (Netgsm, Mutlucell, WhatsApp Cloud API,
 * Twilio, Mock) tek bir kontrat altında soyutlar.
 *
 * Önemli: WhatsApp Cloud API'da, son 24 saat içinde danışan klinikle
 * iletişime geçmemişse, sadece **onaylı template mesajlar** gönderilebilir.
 * Bu yüzden NotificationMessage hem `text` hem `template` taşır.
 * Sağlayıcı kendi yetkinliğine göre uygun olanı kullanır.
 */

export type MessageChannel = "SMS" | "WHATSAPP";

export interface TemplateMessage {
  /** WhatsApp Business Manager'da onaylı template adı */
  name: string;
  /** Template language code (örn: "tr") */
  language: string;
  /** Body parametreleri sırayla {{1}}, {{2}}, ... yerine geçer */
  bodyParameters: string[];
}

export interface NotificationMessage {
  /** Alıcı telefon (E.164 önerilir: +90 5xx xxx xx xx) */
  to: string;
  /** Düz metin gövde — SMS için kullanılır, WhatsApp için yedek */
  body: string;
  /** WhatsApp template — varsa template mesajı gönderilir */
  template?: TemplateMessage;
  /** Bağlı randevu ID'si (loglama için) */
  appointmentId?: string;
}

// Geriye dönük uyumluluk için eski isim
export type SmsMessage = NotificationMessage;

export interface SmsResult {
  success: boolean;
  /** Sağlayıcının döndüğü mesaj ID'si */
  messageId?: string;
  /** Hangi kanal kullanıldı */
  channel?: MessageChannel;
  /** Hata varsa */
  error?: string;
  /** Birim maliyet (TRY) */
  cost?: number;
}

export interface SmsProvider {
  readonly name:
    | "MOCK"
    | "NETGSM"
    | "MUTLUCELL"
    | "TWILIO"
    | "WHATSAPP";
  readonly channel: MessageChannel;

  send(message: NotificationMessage): Promise<SmsResult>;
  sendBatch?(messages: NotificationMessage[]): Promise<SmsResult[]>;
  healthCheck(): Promise<boolean>;
}

/**
 * Standart SMS şablonları (Türkçe ASCII'lenmemiş — provider gerekirse çevirir)
 */
export const SmsTemplates = {
  appointmentApproved: (params: {
    patientName: string;
    doctorName: string;
    dateText: string;
    clinicPhone: string;
  }) =>
    `Sayin ${params.patientName}, ${params.dateText} tarihindeki ${params.doctorName} ile randevunuz ONAYLANMISTIR. Iptal/degisiklik icin: ${params.clinicPhone}`,

  appointmentRejected: (params: {
    patientName: string;
    reason: string;
    alternativeDateText?: string;
    clinicPhone: string;
  }) =>
    `Sayin ${params.patientName}, randevu talebiniz su anda karsilanamamaktadir. ${params.reason}${
      params.alternativeDateText
        ? ` Onerilen alternatif: ${params.alternativeDateText}.`
        : ""
    } Iletisim: ${params.clinicPhone}`,

  appointmentReminder: (params: {
    patientName: string;
    dateText: string;
    clinicName: string;
    clinicPhone: string;
  }) =>
    `Sayin ${params.patientName}, ${params.clinicName} klinigindeki ${params.dateText} randevunuzu hatirlatmak isteriz. Iletisim: ${params.clinicPhone}`,

  appointmentCancelled: (params: {
    patientName: string;
    dateText: string;
    clinicPhone: string;
  }) =>
    `Sayin ${params.patientName}, ${params.dateText} randevunuz iptal edilmistir. Yeni randevu icin: ${params.clinicPhone}`,
};

/**
 * WhatsApp template tanımları — Meta Business Manager'da bu adlarla
 * onaylatılması gerekir.
 */
export const WhatsAppTemplates = {
  /**
   * Template body örneği:
   * "Sayın {{1}}, {{2}} tarihindeki {{3}} ile randevunuz onaylanmıştır.
   *  İptal/değişiklik için: {{4}}"
   */
  appointmentApproved: (params: {
    patientName: string;
    dateText: string;
    doctorName: string;
    clinicPhone: string;
  }): TemplateMessage => ({
    name: "appointment_approved",
    language: "tr",
    bodyParameters: [
      params.patientName,
      params.dateText,
      params.doctorName,
      params.clinicPhone,
    ],
  }),

  /**
   * Template body örneği:
   * "Sayın {{1}}, randevu talebiniz şu anda karşılanamamaktadır.
   *  Sebep: {{2}} Önerilen alternatif: {{3}} İletişim: {{4}}"
   */
  appointmentRejected: (params: {
    patientName: string;
    reason: string;
    alternativeDateText: string;
    clinicPhone: string;
  }): TemplateMessage => ({
    name: "appointment_rejected",
    language: "tr",
    bodyParameters: [
      params.patientName,
      params.reason,
      params.alternativeDateText || "—",
      params.clinicPhone,
    ],
  }),
};

/**
 * Türkçe karakter desteklemeyen sağlayıcılar için ASCII'ye çevirir.
 */
export function toAscii(text: string): string {
  const map: Record<string, string> = {
    ç: "c", Ç: "C",
    ğ: "g", Ğ: "G",
    ı: "i", İ: "I",
    ö: "o", Ö: "O",
    ş: "s", Ş: "S",
    ü: "u", Ü: "U",
  };
  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => map[c] || c);
}
