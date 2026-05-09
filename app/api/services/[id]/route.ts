import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const updateSchema = z.object({
  slug: z.string().regex(slugRegex).min(2).max(60).optional(),
  name: z.string().min(2).max(80).optional(),
  iconName: z.string().min(1).max(40).optional(),
  description: z.string().min(5).max(500).optional(),
  durationMin: z.number().int().min(10).max(240).optional(),
  category: z.enum(["WEIGHT", "SPORTS", "MEDICAL", "LIFESTYLE"]).optional(),
  priceFromTRY: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * PATCH /api/services/[id]
 * Hizmeti günceller. Slug değişiyorsa unique kontrolü yapar.
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

    // Slug değişiyorsa uniqueness kontrol et
    if (parsed.data.slug) {
      const existing = await prisma.service.findUnique({
        where: { slug: parsed.data.slug },
        select: { id: true },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { message: `"${parsed.data.slug}" slug'ı başka bir hizmette kullanılıyor` },
          { status: 409 }
        );
      }
    }

    await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/services/[id]]", err);
    return NextResponse.json(
      {
        message: "Güncellenemedi",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/services/[id]
 *
 * Eğer servisin bağlı randevusu varsa silinmek yerine isActive=false yapılır
 * (silinince geçmiş randevuların service ilişkisi kopar — Prisma onDelete davranışı).
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

    const apptCount = await prisma.appointment.count({
      where: { serviceId: id },
    });

    if (apptCount > 0) {
      // Geçmiş randevular var — soft-delete (pasif yap)
      await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Bu hizmete bağlı ${apptCount} randevu olduğu için hizmet silinmedi, sadece pasif yapıldı.`,
      });
    }

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true, softDeleted: false });
  } catch (err) {
    console.error("[DELETE /api/services/[id]]", err);
    return NextResponse.json({ message: "Silinemedi" }, { status: 500 });
  }
}
