import type {
  SmsProvider,
  SmsMessage,
  SmsResult,
  MessageChannel,
} from "../types";

/**
 * WhatsApp Cloud API (Meta) Sağlayıcısı
 *
 * SMS'e göre çok daha düşük maliyet (genelde 1/10 fiyat), yüksek okuma
 * oranı ve zengin medya desteği sunar.
 *
 * ÖNEMLİ — 24 Saat Kuralı:
 * Klinik tarafından başlatılan mesajlar (randevu onayı/reddi gibi),
 * danışan son 24 saat içinde mesajlaşma başlatmadıysa **onaylı template
 * mesajı** olmak ZORUNDADIR. Free-form text mesajı sadece "service window"
 * içinde gönderilebilir.
 *
 * Template'ler Meta Business Manager'dan onaylatılır:
 *   1. business.facebook.com -> WhatsApp Manager -> Mesaj Şablonları
 *   2. Yeni şablon oluştur: kategori "UTILITY", dil "Turkish (tr)"
 *   3. Bu projede kullanılan template adları:
 *      - appointment_approved
 *      - appointment_rejected
 *
 * Gerekli env değişkenleri:
 *   WHATSAPP_PHONE_NUMBER_ID    — Meta'dan alınan numara ID (graph API path)
 *   WHATSAPP_ACCESS_TOKEN       — Sistem kullanıcı veya geçici access token
 *   WHATSAPP_API_VERSION        — Opsiyonel, varsayılan "v22.0"
 *
 * Dokümantasyon:
 *   https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export class WhatsAppProvider implements SmsProvider {
  readonly name = "WHATSAPP" as const;
  readonly channel: MessageChannel = "WHATSAPP";

  private readonly endpoint: string;

  constructor(
    private readonly config: {
      phoneNumberId: string;
      accessToken: string;
      apiVersion?: string;
    }
  ) {
    if (!config.phoneNumberId || !config.accessToken) {
      throw new Error(
        "WhatsApp yapılandırması eksik: phoneNumberId ve accessToken gerekli."
      );
    }
    const version = config.apiVersion ?? "v22.0";
    this.endpoint = `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`;
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    const to = this.normalizePhone(message.to);

    // Template mesajı tercih edilir (24h kuralı için güvenli yol)
    //
    // ÖNEMLİ: Meta artık template'lerde isimli değişkenleri zorunlu kılıyor
    // ({{patient_name}} gibi, {{1}} değil). API çağrısında her parametre
    // için `parameter_name` alanı gönderiyoruz.
    const payload = message.template
      ? {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "template",
          template: {
            name: message.template.name,
            language: { code: message.template.language },
            components: [
              {
                type: "body",
                parameters: message.template.bodyParameters.map((p) => ({
                  type: "text",
                  parameter_name: p.name,
                  text: p.value,
                })),
              },
            ],
          },
        }
      : {
          // Service window içindeyse free-form text
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: message.body },
        };

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as {
        messages?: Array<{ id: string; message_status?: string }>;
        error?: { message: string; code: number; type: string };
      };

      if (!res.ok || json.error) {
        return {
          success: false,
          channel: this.channel,
          error:
            json.error?.message ??
            `WhatsApp API hatası (HTTP ${res.status})`,
        };
      }

      const messageId = json.messages?.[0]?.id;
      return {
        success: true,
        messageId,
        channel: this.channel,
        // WhatsApp Cloud API faturalandırması conversation bazlı,
        // yaklaşık birim maliyet (TR): ~0.020 USD = ~0.65 TRY
        cost: 0.65,
      };
    } catch (err) {
      return {
        success: false,
        channel: this.channel,
        error:
          err instanceof Error
            ? err.message
            : "Bilinmeyen ağ hatası",
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    // Phone number meta bilgisini sorgula (basit GET)
    try {
      const url = `https://graph.facebook.com/${
        this.config.apiVersion ?? "v22.0"
      }/${this.config.phoneNumberId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.config.accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * WhatsApp E.164 formatı zorunlu kılar — başında + olmadan,
   * ülke kodu dahil tüm rakamlar.
   *
   * +905321234567 → 905321234567
   * 05321234567   → 905321234567
   * 5321234567    → 905321234567
   */
  private normalizePhone(p: string): string {
    const digits = p.replace(/\D/g, "");
    if (digits.startsWith("90") && digits.length === 12) return digits;
    if (digits.startsWith("0") && digits.length === 11) return `9${digits}`;
    if (digits.length === 10) return `90${digits}`;
    return digits;
  }
}
