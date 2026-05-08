import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  generateBackupCodes,
  hashBackupCodes,
  parseBackupCodes,
  unusedBackupCount,
} from "@/lib/totp";

/**
 * GET /api/auth/2fa/backup-codes
 * Sadece kullanılmamış kod SAYISINI döner — kodların kendisini DEĞİL.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { backupCodes: true, totpEnabled: true },
  });

  if (!user || !user.totpEnabled) {
    return NextResponse.json({ unusedCount: 0, totalCount: 0 });
  }

  const records = parseBackupCodes(user.backupCodes);
  return NextResponse.json({
    unusedCount: unusedBackupCount(records),
    totalCount: records.length,
  });
}

const regenerateSchema = z.object({
  password: z.string().min(6),
});

/**
 * POST /api/auth/2fa/backup-codes
 *
 * Tüm yedek kodları sıfırlar ve yenilerini üretir.
 * Eski kodlar artık geçerli olmaz. Şifre doğrulaması zorunlu.
 *
 * Yeni kodlar plain-text olarak BİR KEZ döner — istemci kullanıcıya
 * göstermek/indirtmekle yükümlüdür.
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
    const parsed = regenerateSchema.safeParse(body);
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

    if (!user.totpEnabled) {
      return NextResponse.json(
        { message: "2FA aktif değil" },
        { status: 409 }
      );
    }

    const ok = await compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Şifre hatalı" }, { status: 401 });
    }

    const plainBackupCodes = generateBackupCodes(8);
    const hashed = await hashBackupCodes(plainBackupCodes);

    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes: JSON.stringify(hashed) },
    });

    return NextResponse.json({
      success: true,
      backupCodes: plainBackupCodes,
    });
  } catch (err) {
    console.error("[POST /api/auth/2fa/backup-codes]", err);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
