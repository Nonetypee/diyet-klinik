/**
 * Mesajlaşma Servis Fabrikası
 *
 * Yapılandırma DB'deki MessagingConfig tablosundan okunur (boşsa env'e düşer).
 * Bu sayede admin paneli ayarları değiştirdiğinde anında etki eder —
 * sunucu yeniden başlatmaya GEREK YOK.
 *
 * Cost-saving stratejisi:
 *   1. WhatsApp template mesajı dene (≈0.65 TRY)
 *   2. WhatsApp başarısız olursa fallback sağlayıcıya geç (SMS, ≈1.50 TRY)
 */

import type { SmsProvider, NotificationMessage, SmsResult } from "./types";
import { MockSmsProvider } from "./providers/mock";
import { NetgsmProvider } from "./providers/netgsm";
import { MutlucellProvider } from "./providers/mutlucell";
import { WhatsAppProvider } from "./providers/whatsapp";
import {
  getMessagingConfig,
  type MessagingProviderName,
  type ResolvedMessagingConfig,
} from "@/lib/messaging-config";

export * from "./types";

function buildProvider(
  name: MessagingProviderName,
  cfg: ResolvedMessagingConfig
): SmsProvider {
  switch (name) {
    case "WHATSAPP":
      return new WhatsAppProvider({
        phoneNumberId: cfg.whatsapp.phoneNumberId,
        accessToken: cfg.whatsapp.accessToken,
        apiVersion: cfg.whatsapp.apiVersion,
      });

    case "NETGSM":
      return new NetgsmProvider({
        userCode: cfg.netgsm.userCode,
        password: cfg.netgsm.password,
        header: cfg.netgsm.header,
      });

    case "MUTLUCELL":
      return new MutlucellProvider({
        username: cfg.mutlucell.username,
        password: cfg.mutlucell.password,
        orgn: cfg.mutlucell.orgn,
      });

    case "MOCK":
    default:
      return new MockSmsProvider();
  }
}

/**
 * Birincil sağlayıcıyı döndürür. ASYNC çünkü DB'den okur.
 */
export async function getSmsProvider(): Promise<SmsProvider> {
  const cfg = await getMessagingConfig();
  try {
    return buildProvider(cfg.primary, cfg);
  } catch (err) {
    console.warn(
      "[messaging] Birincil sağlayıcı başlatılamadı, MOCK kullanılıyor:",
      err
    );
    return new MockSmsProvider();
  }
}

/**
 * Yedek (fallback) sağlayıcı varsa döndürür.
 */
export async function getFallbackProvider(): Promise<SmsProvider | null> {
  const cfg = await getMessagingConfig();
  if (!cfg.fallback) return null;
  try {
    return buildProvider(cfg.fallback, cfg);
  } catch (err) {
    console.warn(
      `[messaging] Fallback sağlayıcı (${cfg.fallback}) başlatılamadı:`,
      err
    );
    return null;
  }
}

/**
 * Yüksek seviyeli mesaj gönderici.
 *
 * Akış:
 *   1. DB'den config oku
 *   2. Birincil sağlayıcıyı dene
 *   3. Başarısızsa fallback sağlayıcıyı dene
 *   4. Sonucu döndür (channel = gerçekten kullanılan kanal)
 */
export async function sendSms(
  message: NotificationMessage
): Promise<SmsResult> {
  const cfg = await getMessagingConfig();

  let primary: SmsProvider;
  try {
    primary = buildProvider(cfg.primary, cfg);
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : `Birincil sağlayıcı (${cfg.primary}) başlatılamadı`,
    };
  }

  const result = await primary.send(message);
  if (result.success) return result;

  // Fallback varsa ve birincilden farklıysa dene
  if (cfg.fallback && cfg.fallback !== cfg.primary) {
    try {
      const fallback = buildProvider(cfg.fallback, cfg);
      console.warn(
        `[messaging] Birincil (${primary.name}) başarısız: ${result.error}. Fallback (${fallback.name}) deneniyor.`
      );
      const fallbackResult = await fallback.send(message);
      return {
        ...fallbackResult,
        channel: fallback.channel,
      };
    } catch (err) {
      console.warn("[messaging] Fallback başlatılamadı:", err);
    }
  }

  return result;
}
