import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  verifyTotpToken,
  generateBackupCodes,
  hashBackupCodes,
} from "@/lib/totp";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "6 haneli kod"),
});

/**
 * POST /api/auth/2fa/verify
 *
 * Setup aşamasında oluşturulan secret'a karşı 6 haneli kodu doğrular.
 * Başarılıysa:
 *   - totpEnabled = true
 *   - totpVerifiedAt = now
 *   - 8 yedek kod üretilir, hashli formatta saklanır
 *
 * Yedek kodlar **bir defaya mahsus** plain-text olarak döner —
 * istemci tarafında kullanıcıya gösterilip indirtilmesi gerekir.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Geçersiz kod formatı (6 hane gerekli)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    if (!user.totpSecret) {
      return NextResponse.json(
        { message: "Önce 2FA kurulumu başlatın" },
        { status: 409 }
      );
    }

    const valid = verifyTotpToken(parsed.data.code, user.totpSecret);
    if (!valid) {
      return NextResponse.json(
        { message: "Kod doğrulanamadı, tekrar deneyin" },
        { status: 401 }
      );
    }

    // Plain backup codes oluştur — bir kez döneceğiz, sonra sadece hash'leri kalır
    const plainBackupCodes = generateBackupCodes(8);
    const hashed = await hashBackupCodes(plainBackupCodes);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: true,
        totpVerifiedAt: new Date(),
        backupCodes: JSON.stringify(hashed),
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes: plainBackupCodes,
      message: "2FA başarıyla aktive edildi",
    });
  } catch (err) {
    console.error("[POST /api/auth/2fa/verify]", err);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
