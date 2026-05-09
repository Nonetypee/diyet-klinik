import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Slug — sadece küçük harf, rakam, tire
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createSchema = z.object({
  slug: z.string().regex(slugRegex, "Sadece küçük harf, rakam ve tire").min(2).max(60),
  name: z.string().min(2).max(80),
  iconName: z.string().min(1).max(40),
  description: z.string().min(5).max(500),
  durationMin: z.number().int().min(10).max(240),
  category: z.enum(["WEIGHT", "SPORTS", "MEDICAL", "LIFESTYLE"]),
  priceFromTRY: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * GET /api/services
 * Public: aktif servisleri döner.
 * Admin oturumu varsa pasif olanlar da gelir.
 */
export async function GET() {
  const session = await auth();
  const items = await prisma.service.findMany({
    where: session?.user ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

/**
 * POST /api/services
 * Yeni hizmet ekler. Auth zorunlu.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form geçersiz", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Slug uniqueness — Service.slug @unique
    const existing = await prisma.service.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { message: `"${parsed.data.slug}" slug'ı zaten kullanılıyor` },
        { status: 409 }
      );
    }

    const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";
    const clinic = await prisma.clinic.findUnique({ where: { slug } });
    if (!clinic) {
      return NextResponse.json(
        { message: "Klinik bulunamadı" },
        { status: 500 }
      );
    }

    const created = await prisma.service.create({
      data: {
        clinicId: clinic.id,
        slug: parsed.data.slug,
        name: parsed.data.name,
        iconName: parsed.data.iconName,
        description: parsed.data.description,
        durationMin: parsed.data.durationMin,
        category: parsed.data.category,
        priceFromTRY: parsed.data.priceFromTRY ?? null,
        isActive: parsed.data.isActive ?? true,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });

    return NextResponse.json(
      { success: true, id: created.id, slug: created.slug },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/services]", err);
    return NextResponse.json(
      {
        message: "Sunucu hatası",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
