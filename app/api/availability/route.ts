import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { computeAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability?date=YYYY-MM-DD&serviceSlug=kilo-yonetimi
 *
 * Verilen tarih + hizmet için kullanılabilir slot listesini döner.
 * Public endpoint — landing page formundan çağrılır.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const serviceSlug = searchParams.get("serviceSlug");

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { message: "Geçerli bir tarih girin (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (!serviceSlug) {
      return NextResponse.json(
        { message: "Hizmet slug'ı gerekli" },
        { status: 400 }
      );
    }

    // Hizmet süresini al
    const service = await prisma.service.findUnique({
      where: { slug: serviceSlug },
      select: { durationMin: true },
    });

    if (!service) {
      return NextResponse.json(
        { message: `"${serviceSlug}" adlı hizmet bulunamadı` },
        { status: 404 }
      );
    }

    // Date parse — yerel saat dilimi
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const date = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);

    const result = await computeAvailability({
      date,
      serviceDurationMin: service.durationMin,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/availability]", err);
    return NextResponse.json(
      {
        message: "Müsaitlik hesaplanamadı",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
