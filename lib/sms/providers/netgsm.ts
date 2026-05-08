import type {
  SmsProvider,
  SmsMessage,
  SmsResult,
  MessageChannel,
} from "../types";
import { toAscii } from "../types";

/**
 * Netgsm SMS Sağlayıcısı (Türkiye)
 *
 * Dokümantasyon: https://www.netgsm.com.tr/api-dokumanlari/
 *
 * Kullanım için gerekli env değişkenleri:
 *   NETGSM_USERCODE  — Üyelik numaranız
 *   NETGSM_PASSWORD  — API şifreniz
 *   NETGSM_HEADER    — Onaylı gönderici adı (örn: "KLINIK")
 */
export class NetgsmProvider implements SmsProvider {
  readonly name = "NETGSM" as const;
  readonly channel: MessageChannel = "SMS";

  private readonly endpoint = "https://api.netgsm.com.tr/sms/send/get";

  constructor(
    private readonly config: {
      userCode: string;
      password: string;
      header: string;
    }
  ) {
    if (!config.userCode || !config.password || !config.header) {
      throw new Error(
        "Netgsm yapılandırması eksik: userCode, password ve header gerekli."
      );
    }
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    // Netgsm Türkçe karakter desteklese de standart paketlerde GSM-7
    // alfabe ile sınırlandığı için ASCII'ye çevirmek karakter sayısını korur.
    const body = toAscii(message.body);
    const phone = this.normalizePhone(message.to);

    const params = new URLSearchParams({
      usercode: this.config.userCode,
      password: this.config.password,
      gsmno: phone,
      message: body,
      msgheader: this.config.header,
      filter: "0",
    });

    try {
      const res = await fetch(`${this.endpoint}?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "text/plain" },
      });
      const text = await res.text();

      // Netgsm yanıt formatı: "00 jobId" başarı, "20", "30" vb. hata kodları
      const [code, jobId] = text.trim().split(" ");
      if (code === "00") {
        return {
          success: true,
          messageId: jobId ?? `netgsm_${Date.now()}`,
          channel: this.channel,
        };
      }

      return {
        success: false,
        error: `Netgsm hata kodu: ${code} (${this.errorText(code)})`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Bilinmeyen ağ hatası",
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    // Netgsm bakiye sorgusu üzerinden basit kontrol
    try {
      const res = await fetch(
        `https://api.netgsm.com.tr/balance/list/get/?usercode=${this.config.userCode}&password=${this.config.password}&stip=2`
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  private normalizePhone(p: string): string {
    const digits = p.replace(/\D/g, "");
    if (digits.startsWith("90") && digits.length === 12) return digits;
    if (digits.startsWith("0") && digits.length === 11) return `9${digits}`;
    if (digits.length === 10) return `90${digits}`;
    return digits;
  }

  private errorText(code: string): string {
    const ERRORS: Record<string, string> = {
      "20": "Mesaj metni çok uzun ya da standart dışı karakter içeriyor",
      "30": "Geçersiz kullanıcı adı/şifre",
      "40": "Mesaj başlığı sistemde tanımlı değil",
      "50": "Abone hesap onaylı değil",
      "70": "Hatalı parametre",
      "85": "Mükerrer gönderim engeli",
    };
    return ERRORS[code] ?? "Bilinmeyen hata";
  }
}
