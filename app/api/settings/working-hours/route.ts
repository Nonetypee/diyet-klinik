import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const dayHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  close: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closed: z.boolean().optional(),
});

const workingHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

/**
 * POST /api/settings/working-hours
 *
 * Klinik çalışma saatlerini günceller. Auth zorunlu.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = workingHoursSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Geçersiz format",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Her gün için: kapalı değilse open ve close zorunlu
    for (const [day, hours] of Object.entries(parsed.data)) {
      if (!hours.closed) {
        if (!hours.open || !hours.close) {
          return NextResponse.json(
            {
              message: `${day} günü için açılış ve kapanış saati gerekli (veya "kapalı" işaretleyin)`,
            },
            { status: 400 }
          );
        }
        if (hours.close <= hours.open) {
          return NextResponse.json(
            {
              message: `${day} günü için kapanış saati açılıştan sonra olmalı`,
            },
            { status: 400 }
          );
        }
      }
    }

    const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";
    await prisma.clinic.update({
      where: { slug },
      data: { workingHours: JSON.stringify(parsed.data) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/settings/working-hours]", err);
    return NextResponse.json(
      {
        message: "Çalışma saatleri güncellenemedi",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
