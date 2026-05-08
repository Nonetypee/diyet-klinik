import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import {
  consumeBackupCode,
  parseBackupCodes,
  verifyTotpToken,
} from "@/lib/totp";

/**
 * Auth.js v5 — Ana yapılandırma
 *
 * Credentials provider ile e-posta + şifre + (opsiyonel) TOTP kodu doğrulaması.
 * Şifreler bcrypt ile hashlenmiş olarak User.passwordHash'te saklanır.
 *
 * 2FA Akışı:
 *   1. İstemci önce sadece email + password ile dener
 *   2. User.totpEnabled === true ise CustomError("TOTP_REQUIRED") atılır
 *   3. İstemci TOTP girdisini gösterir, email + password + totpCode ile tekrar dener
 *   4. TOTP kodu (6 hane) ya da yedek kod (XXXX-XXXX) doğrulanır
 */

// Auth.js v5'te custom error tipiyle istemciye sinyal gönderiyoruz
class TotpRequiredError extends CredentialsSignin {
  code = "TOTP_REQUIRED";
}

class InvalidTotpError extends CredentialsSignin {
  code = "INVALID_TOTP";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "INVALID_CREDENTIALS";
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // 6 haneli TOTP veya yedek kod (XXXX-XXXX)
  totpCode: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
        totpCode: { label: "Doğrulama Kodu", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) throw new InvalidCredentialsError();

        const { email, password, totpCode } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.isActive) throw new InvalidCredentialsError();

        const valid = await compare(password, user.passwordHash);
        if (!valid) throw new InvalidCredentialsError();

        // 2FA aktifse kod gerekli
        if (user.totpEnabled && user.totpSecret) {
          if (!totpCode) {
            // İstemci ilk adımda sadece password göndermiş — 2. adımı tetikle
            throw new TotpRequiredError();
          }

          // 6 haneli rakam → TOTP olarak değerlendir
          const cleaned = totpCode.replace(/\s/g, "").trim();
          const isTotp = /^\d{6}$/.test(cleaned);

          if (isTotp) {
            const ok = verifyTotpToken(cleaned, user.totpSecret);
            if (!ok) throw new InvalidTotpError();
          } else {
            // Yedek kod denemesi (XXXX-XXXX)
            const records = parseBackupCodes(user.backupCodes);
            const updated = await consumeBackupCode(cleaned, records);
            if (!updated) throw new InvalidTotpError();

            // Yedek kodu "kullanıldı" olarak işaretle
            await prisma.user.update({
              where: { id: user.id },
              data: { backupCodes: JSON.stringify(updated) },
            });
          }
        }

        // Son giriş zamanı kaydet
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
});
