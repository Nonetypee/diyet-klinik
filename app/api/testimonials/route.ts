import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  patientName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  service: z.string().max(80).optional().nullable(),
  result: z.string().max(80).optional().nullable(),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

/**
 * GET /api/testimonials
 * Admin için tüm yorumları döner.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  const items = await prisma.testimonial.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

/**
 * POST /api/testimonials
 * Yeni yorum ekler.
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
        {
          message: "Form geçersiz",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
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

    const created = await prisma.testimonial.create({
      data: {
        clinicId: clinic.id,
        patientName: parsed.data.patientName,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        service: parsed.data.service ?? null,
        result: parsed.data.result ?? null,
        isFeatured: parsed.data.isFeatured ?? false,
        isVerified: parsed.data.isVerified ?? false,
      },
    });

    return NextResponse.json({ success: true, id: created.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/testimonials]", err);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
