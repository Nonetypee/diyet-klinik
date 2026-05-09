import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { deleteBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/backup/[file]
 * Tek yedek sil.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { file } = await context.params;
    await deleteBackup(file);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/backup/[file]]", err);
    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : "Silinemedi",
      },
      { status: 500 }
    );
  }
}
