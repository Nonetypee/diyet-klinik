import { authenticator } from "otplib";
import { hash as bcryptHash, compare as bcryptCompare } from "bcryptjs";
import QRCode from "qrcode";

/**
 * TOTP (RFC 6238) yardımcı fonksiyonları
 *
 * Google Authenticator, Authy, 1Password, Microsoft Authenticator gibi
 * standart TOTP istemcileriyle uyumludur.
 */

// 6 haneli kod, 30 saniyelik pencere, ±1 step (önceki/sonraki kod da geçerli)
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

const APP_NAME = "Diyet Klinik";

export interface BackupCodeRecord {
  hash: string;
  used: boolean;
  usedAt?: string;
}

/**
 * Yeni bir TOTP secret üretir. Base32 encoded.
 * Bu secret hem authenticator app'e hem DB'ye kaydedilir.
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Authenticator app'in QR olarak okuyacağı otpauth:// URL'ini döndürür.
 * Format: otpauth://totp/{App}:{user}?secret=...&issuer={App}
 */
export function buildOtpAuthUrl(params: {
  email: string;
  secret: string;
}): string {
  return authenticator.keyuri(params.email, APP_NAME, params.secret);
}

/**
 * QR data URL — <img src> ile direkt gösterilebilir.
 */
export async function generateQrDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
    color: { dark: "#0F172A", light: "#FFFFFF" },
  });
}

/**
 * Kullanıcının girdiği 6 haneli kodu doğrular.
 * `window: 1` ayarı sayesinde ±30 saniye tolerans var.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.replace(/\s/g, "").trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;
  try {
    return authenticator.verify({ token: cleanToken, secret });
  } catch {
    return false;
  }
}

// =============================================================
// Yedek Kodlar (Backup Codes)
// =============================================================

/**
 * 8 adet okunabilir yedek kod üretir (telefon kayıp senaryosu için).
 * Format: XXXX-XXXX (büyük harf + rakam, l/o/0/1 hariç)
 */
export function generateBackupCodes(count = 8): string[] {
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // l, I, O, 0, 1 hariç
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const part = (n: number) => {
      let s = "";
      for (let j = 0; j < n; j++) {
        s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
      return s;
    };
    codes.push(`${part(4)}-${part(4)}`);
  }

  return codes;
}

/**
 * Yedek kodları bcrypt ile hash'leyip JSON formatında saklamaya hazırlar.
 */
export async function hashBackupCodes(
  plainCodes: string[]
): Promise<BackupCodeRecord[]> {
  const records = await Promise.all(
    plainCodes.map(async (code) => ({
      hash: await bcryptHash(code, 10),
      used: false,
    }))
  );
  return records;
}

/**
 * Kullanıcının girdiği kod, kayıtlı yedek kodlardan birinin hash'iyle eşleşiyor mu?
 * Eşleşirse o kodu "used: true" yapıp güncellenmiş listeyi döner.
 *
 * @returns null = eşleşme yok; otherwise = güncellenmiş kayıt listesi
 */
export async function consumeBackupCode(
  inputCode: string,
  records: BackupCodeRecord[]
): Promise<BackupCodeRecord[] | null> {
  const cleaned = inputCode.replace(/\s/g, "").toUpperCase().trim();
  if (!cleaned) return null;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (record.used) continue;
    if (await bcryptCompare(cleaned, record.hash)) {
      const updated = [...records];
      updated[i] = {
        ...record,
        used: true,
        usedAt: new Date().toISOString(),
      };
      return updated;
    }
  }
  return null;
}

/**
 * DB'deki JSON string'i parse eder.
 */
export function parseBackupCodes(json: string | null): BackupCodeRecord[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as BackupCodeRecord[];
  } catch {
    return [];
  }
}

/**
 * Kullanılmamış kod sayısı.
 */
export function unusedBackupCount(records: BackupCodeRecord[]): number {
  return records.filter((r) => !r.used).length;
}
