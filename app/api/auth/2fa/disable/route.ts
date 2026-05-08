import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  password: z.string().min(6, "Şifre gerekli"),
});

/**
 * POST /api/auth/2fa/disable
 *
 * 2FA'yı devre dışı bırakır. Güvenlik için **mevcut şifre** doğrulaması ister.
 * Sosyal mühendislik ve session-hijack senaryolarına karşı koruma.
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
        { message: "Şifre gerekli" },
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

    const valid = await compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { message: "Şifre hatalı" },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpVerifiedAt: null,
        backupCodes: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "2FA devre dışı bırakıldı",
    });
  } catch (err) {
    console.error("[POST /api/auth/2fa/disable]", err);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
