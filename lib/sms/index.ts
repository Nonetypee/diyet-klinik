/**
 * Mesajlaşma Servis Fabrikası
 *
 * Çevre değişkenine göre uygun sağlayıcıyı döndürür.
 * MESSAGING_PROVIDER tek yetkili sağlayıcıyı belirler.
 *
 * Cost-saving stratejisi:
 *   1. WhatsApp template mesajı dene (≈0.65 TRY)
 *   2. WhatsApp başarısız olursa SMS'e fallback yap (≈1.50 TRY)
 *
 * Bu, MESSAGING_FALLBACK_PROVIDER tanımlandığında otomatik aktif olur.
 */

import type { SmsProvider, NotificationMessage, SmsResult } from "./types";
import { MockSmsProvider } from "./providers/mock";
import { NetgsmProvider } from "./providers/netgsm";
import { MutlucellProvider } from "./providers/mutlucell";
import { WhatsAppProvider } from "./providers/whatsapp";

export * from "./types";

let cachedPrimary: SmsProvider | null = null;
let cachedFallback: SmsProvider | null = null;

function buildProvider(name: string): SmsProvider {
  switch (name.toUpperCase()) {
    case "WHATSAPP":
      return new WhatsAppProvider({
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
        apiVersion: process.env.WHATSAPP_API_VERSION,
      });

    case "NETGSM":
      return new NetgsmProvider({
        userCode: process.env.NETGSM_USERCODE ?? "",
        password: process.env.NETGSM_PASSWORD ?? "",
        header: process.env.NETGSM_HEADER ?? "",
      });

    case "MUTLUCELL":
      return new MutlucellProvider({
        username: process.env.MUTLUCELL_USERNAME ?? "",
        password: process.env.MUTLUCELL_PASSWORD ?? "",
        orgn: process.env.MUTLUCELL_ORGN ?? "",
      });

    case "MOCK":
    default:
      return new MockSmsProvider();
  }
}

export function getSmsProvider(): SmsProvider {
  if (cachedPrimary) return cachedPrimary;
  // Geriye uyumluluk: SMS_PROVIDER hala destekleniyor
  const primary =
    process.env.MESSAGING_PROVIDER ?? process.env.SMS_PROVIDER ?? "MOCK";
  cachedPrimary = buildProvider(primary);
  return cachedPrimary;
}

export function getFallbackProvider(): SmsProvider | null {
  if (cachedFallback) return cachedFallback;
  const fallback = process.env.MESSAGING_FALLBACK_PROVIDER;
  if (!fallback) return null;
  try {
    cachedFallback = buildProvider(fallback);
    return cachedFallback;
  } catch (err) {
    console.warn("[messaging] Fallback sağlayıcısı başlatılamadı:", err);
    return null;
  }
}

/**
 * Yüksek seviyeli mesaj gönderici.
 *
 * 1. Birincil sağlayıcı dener (genelde WhatsApp — düşük maliyet)
 * 2. Hata durumunda fallback sağlayıcıya düşer (SMS)
 * 3. Sonuç döner — hangi kanalın kullanıldığı `result.channel`'da
 */
export async function sendSms(message: NotificationMessage): Promise<SmsResult> {
  const primary = getSmsProvider();
  const result = await primary.send(message);

  if (result.success) return result;

  // Fallback sağlayıcı varsa dene
  const fallback = getFallbackProvider();
  if (fallback && fallback.name !== primary.name) {
    console.warn(
      `[messaging] Birincil (${primary.name}) başarısız oldu, fallback'e geçiliyor (${fallback.name}). Hata:`,
      result.error
    );
    const fallbackResult = await fallback.send(message);
    return {
      ...fallbackResult,
      // Hangi kanalın gerçekten kullanıldığını koru
      channel: fallback.channel,
    };
  }

  return result;
}
