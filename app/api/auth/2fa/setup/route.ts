import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  generateTotpSecret,
  buildOtpAuthUrl,
  generateQrDataUrl,
} from "@/lib/totp";

/**
 * POST /api/auth/2fa/setup
 *
 * Yeni bir TOTP secret üretir ve QR data URL döner.
 * Bu aşamada DB'ye kaydedilir AMA totpEnabled=false kalır —
 * kullanıcı verify endpoint'inde 6 haneli kodu girip aktive edene kadar.
 *
 * NOT: Halihazırda 2FA açık olan kullanıcı için secret regenerate ETMEZ —
 * önce /disable çağrılmalıdır (yanlışlıkla kilitlenmeyi önler).
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Yetkisiz erişim" },
        { status: 401 }
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

    if (user.totpEnabled) {
      return NextResponse.json(
        {
          message:
            "2FA zaten aktif. Yeniden kurmak için önce devre dışı bırakın.",
        },
        { status: 409 }
      );
    }

    const secret = generateTotpSecret();
    const otpAuthUrl = buildOtpAuthUrl({
      email: user.email,
      secret,
    });
    const qrDataUrl = await generateQrDataUrl(otpAuthUrl);

    // Kalıcılaştır ama enable etme — verify aşamasını bekliyor
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: secret,
        totpEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      secret,
      otpAuthUrl,
      qrDataUrl,
    });
  } catch (err) {
    console.error("[POST /api/auth/2fa/setup]", err);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
