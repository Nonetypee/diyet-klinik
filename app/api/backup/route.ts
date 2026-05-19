import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listBackups, createBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

/**
 * GET /api/backup
 * Yedek listesi.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  try {
    const items = await listBackups();
    return NextResponse.json(items);
  } catch (err) {
    console.error("[GET /api/backup]", err);
    return NextResponse.json(
      { message: "Yedekler listelenemedi" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backup
 * Manuel yedek oluştur.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  try {
    const info = await createBackup();
    return NextResponse.json({ success: true, backup: info }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/backup]", err);
    const detail = err instanceof Error ? err.message : undefined;
    return NextResponse.json(
      {
        message: detail ?? "Yedek oluşturulamadı",
        details: detail,
      },
      { status: 500 }
    );
  }
}
