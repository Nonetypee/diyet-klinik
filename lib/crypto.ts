import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

/**
 * Simetrik şifreleme yardımcısı
 *
 * DB'de saklanan WhatsApp access token, SMS şifresi gibi sırları
 * AES-256-GCM ile şifreler. Anahtar NEXTAUTH_SECRET'tan türetilir.
 *
 * Çıktı formatı (hex): "iv:tag:ciphertext"
 * - iv: 12 byte (24 hex karakter)
 * - tag: 16 byte (32 hex karakter) — authentication tag
 * - ciphertext: değişken uzunluk
 *
 * NOT: NEXTAUTH_SECRET değişirse tüm eski şifrelenmiş veriler geçersiz olur.
 * Üretimde sabit ve güçlü bir secret kullanın.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    // Geliştirme için sabit fallback — üretimde error fırlat
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXTAUTH_SECRET yapılandırılmamış veya çok kısa. En az 16 karakter olmalı."
      );
    }
    return scryptSync(
      "diyet-klinik-dev-fallback-secret",
      "diyet-klinik-salt",
      KEY_LENGTH
    );
  }
  // PBKDF2 yerine scrypt — memory-hard, brute force'a daha dayanıklı
  return scryptSync(secret, "diyet-klinik-msg-salt", KEY_LENGTH);
}

/**
 * Düz metni şifreler. Boş/null değer → boş string döner.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString(
    "hex"
  )}`;
}

/**
 * Şifrelenmiş veriyi çözer. Format hatalıysa veya tag uyuşmazsa null döner.
 */
export function decrypt(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  const parts = encrypted.split(":");
  if (parts.length !== 3) return null;

  try {
    const [ivHex, tagHex, ciphertextHex] = parts;
    const decipher = createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[crypto] Decrypt hatası:", err);
    return null;
  }
}

/**
 * UI'a gösterirken sırrı maskeler — "abc123def456" → "abc1…f456" gibi.
 * Hiçbir zaman açık metni client'a göndermeyiz; bu sadece "ayarlanmış mı"
 * görsel ipucu için kullanılır.
 */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}
