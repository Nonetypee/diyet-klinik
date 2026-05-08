import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const dieticianUpdateSchema = z.object({
  fullName: z.string().min(3),
  title: z.string().min(2),
  specialty: z.string().min(2),
  bio: z.string().min(10),
  yearsOfExperience: z.number().int().min(0).nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = dieticianUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form geçersiz", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.dietician.findFirst({
      where: { isActive: true },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Diyetisyen kaydı bulunamadı" },
        { status: 404 }
      );
    }

    const updated = await prisma.dietician.update({
      where: { id: existing.id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (err) {
    console.error("[POST /api/settings/dietician]", err);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
