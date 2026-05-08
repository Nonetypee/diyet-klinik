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

/**
 * Template body parametresi.
 *
 * Meta WhatsApp Business Manager artık SADECE isimli değişkenleri
 * kabul ediyor ({{patient_name}} gibi), pozisyonel ({{1}}) DEĞİL.
 * Bu yüzden her parametre için `name` alanı zorunlu.
 */
export interface TemplateBodyParameter {
  /** Template body'de geçen isim — örn: "patient_name" (küçük harf + alt çizgi) */
  name: string;
  /** Yerine geçecek değer */
  value: string;
}

export interface TemplateMessage {
  /** WhatsApp Business Manager'da onaylı template adı */
  name: string;
  /** Template language code (örn: "tr") */
  language: string;
  /** Body parametreleri — isimli ({{patient_name}}) formatında */
  bodyParameters: TemplateBodyParameter[];
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
 *
 * ÖNEMLİ — Template'ler ismli değişkenler kullanır, pozisyonel ({{1}}) DEĞİL.
 * Burada listelenen değişken adları, Manager'daki template'le birebir
 * aynı olmalıdır.
 *
 * Meta kısıtı: Bir template'te değişken sayısı/metin uzunluğu oranı
 * dengeli olmalı. Çok değişken + kısa metin → onay reddedilir.
 * Bu yüzden her template 3 değişkenle sınırlı tutulmuştur.
 */
export const WhatsAppTemplates = {
  /**
   * Manager'daki onaylı body metni:
   *   "Sayın {{patient_name}}, beslenme danışmanlığı randevunuz Diyet
   *    Klinik tarafından onaylanmıştır. Randevu tarihi: {{appointment_date}}.
   *    İptal veya değişiklik için kliniğimizi {{clinic_phone}}
   *    numarasından arayabilirsiniz. Sağlıklı günler dileriz."
   *
   * NOT — Meta kuralları:
   *   1. Pozisyonel {{1}} yerine isimli değişken
   *   2. 3 değişken (uzunluk/değişken oranı için)
   *   3. Son değişkenden SONRA gerçek metin var ("Sağlıklı günler dileriz.")
   */
  appointmentApproved: (params: {
    patientName: string;
    dateText: string;
    /** Sadece SMS fallback'inde gösterilir, WhatsApp template'inde yok */
    doctorName?: string;
    clinicPhone: string;
  }): TemplateMessage => ({
    name: "appointment_approved",
    language: "tr",
    bodyParameters: [
      { name: "patient_name", value: params.patientName },
      { name: "appointment_date", value: params.dateText },
      { name: "clinic_phone", value: params.clinicPhone },
    ],
  }),

  /**
   * Manager'daki onaylı body metni:
   *   "Sayın {{patient_name}}, beslenme danışmanlığı randevu talebiniz
   *    şu anda karşılanamamaktadır. Detaylar: {{details}}. Yeniden
   *    randevu için kliniğimizi {{clinic_phone}} numarasından
   *    arayabilirsiniz. Anlayışınız için teşekkür ederiz."
   *
   * `details` alanı kodda "<sebep> Önerilen alternatif: <tarih>"
   * şeklinde birleştirilir.
   */
  appointmentRejected: (params: {
    patientName: string;
    reason: string;
    alternativeDateText?: string;
    clinicPhone: string;
  }): TemplateMessage => {
    const details = params.alternativeDateText
      ? `${params.reason} Önerilen alternatif: ${params.alternativeDateText}`
      : params.reason;

    return {
      name: "appointment_rejected",
      language: "tr",
      bodyParameters: [
        { name: "patient_name", value: params.patientName },
        { name: "details", value: details },
        { name: "clinic_phone", value: params.clinicPhone },
      ],
    };
  },
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
