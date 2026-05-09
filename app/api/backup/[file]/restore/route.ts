import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { restoreBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

const schema = z.object({
  /** Mevcut admin şifresi — riskli bir işlem olduğu için ekstra doğrulama */
  password: z.string().min(6),
});

/**
 * POST /api/backup/[file]/restore
 *
 * Veritabanını belirtilen yedekten geri yükler.
 *
 * GÜVENLİK:
 *   - Auth zorunlu
 *   - Admin şifresi tekrar doğrulanır (kazara tıklamayı engellemek için)
 *   - Mevcut DB önce "pre-restore-{timestamp}.db" olarak yedeklenir
 *     (yanlış yedek seçildiyse geri dönüş yolu açık kalır)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Şifre gerekli" },
        { status: 400 }
      );
    }

    // Şifre doğrulama
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    const ok = await compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Şifre hatalı" }, { status: 401 });
    }

    const { file } = await context.params;

    // Prisma client'ı disconnect ediyoruz — DB dosyası değiştirileceği için
    // açık bağlantılar tutarsız hale gelebilir
    await prisma.$disconnect().catch(() => {});

    const result = await restoreBackup(file);

    console.warn(
      `[restore] Veritabanı geri yüklendi: ${result.restoredFrom} (önce ${result.preRestoreSnapshot} alındı). Kullanıcı: ${user.email}`
    );

    return NextResponse.json({
      success: true,
      ...result,
      message:
        "Veritabanı başarıyla geri yüklendi. Sayfayı yenilemeniz önerilir.",
    });
  } catch (err) {
    console.error("[POST /api/backup/[file]/restore]", err);
    return NextResponse.json(
      {
        message: "Geri yükleme başarısız",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
