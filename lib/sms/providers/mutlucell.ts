import type {
  SmsProvider,
  SmsMessage,
  SmsResult,
  MessageChannel,
} from "../types";
import { toAscii } from "../types";

/**
 * Mutlucell SMS Sağlayıcısı (Türkiye)
 *
 * Dokümantasyon: https://www.mutlucell.com/api-dokumanlari
 *
 * Kullanım için gerekli env değişkenleri:
 *   MUTLUCELL_USERNAME — Kullanıcı adı
 *   MUTLUCELL_PASSWORD — Parola
 *   MUTLUCELL_ORGN     — Onaylı gönderici (örn: "KLINIKAD")
 */
export class MutlucellProvider implements SmsProvider {
  readonly name = "MUTLUCELL" as const;
  readonly channel: MessageChannel = "SMS";

  private readonly endpoint = "https://smsgw.mutlucell.com/smsgw-ws/sndblkex";

  constructor(
    private readonly config: {
      username: string;
      password: string;
      orgn: string;
    }
  ) {
    if (!config.username || !config.password || !config.orgn) {
      throw new Error("Mutlucell yapılandırması eksik.");
    }
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    const phone = this.normalizePhone(message.to);
    const body = toAscii(message.body);

    // Mutlucell tipik olarak XML/POST tabanlı bir API sunar.
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<smspack ka="${this.escapeXml(this.config.username)}" pwd="${this.escapeXml(this.config.password)}" org="${this.escapeXml(this.config.orgn)}">
  <mesaj id="${message.appointmentId ?? Date.now()}">
    <metin>${this.escapeXml(body)}</metin>
    <nums>${phone}</nums>
  </mesaj>
</smspack>`;

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=UTF-8" },
        body: xml,
      });
      const text = await res.text();

      // Başarı durumunda: "$ack:<jobId>"; hata: "$err:<kod>"
      if (text.startsWith("$ack:")) {
        return {
          success: true,
          messageId: text.replace("$ack:", "").trim(),
          channel: this.channel,
        };
      }
      return {
        success: false,
        error: text.replace("$err:", "Mutlucell hatası: ").trim(),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Bilinmeyen ağ hatası",
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return true; // Bakiye sorgusu burada genişletilebilir
  }

  private normalizePhone(p: string): string {
    const d = p.replace(/\D/g, "");
    if (d.startsWith("0") && d.length === 11) return d.slice(1);
    if (d.startsWith("90") && d.length === 12) return d.slice(2);
    return d;
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
