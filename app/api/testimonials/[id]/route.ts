import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  patientName: z.string().min(2).max(80).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).optional(),
  service: z.string().max(80).nullable().optional(),
  result: z.string().max(80).nullable().optional(),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

/**
 * PATCH /api/testimonials/[id]
 * Yorum günceller (örn: isFeatured toggle).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form geçersiz", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await prisma.testimonial.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/testimonials/[id]]", err);
    return NextResponse.json({ message: "Güncellenemedi" }, { status: 500 });
  }
}

/**
 * DELETE /api/testimonials/[id]
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await context.params;
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/testimonials/[id]]", err);
    return NextResponse.json({ message: "Silinemedi" }, { status: 500 });
  }
}
