import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const clinicUpdateSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().nullable().optional(),
  phone: z.string().min(7),
  email: z.string().email(),
  whatsapp: z.string().nullable().optional(),
  address: z.string().min(5),
  city: z.string(),
  district: z.string(),
  kvkkText: z.string().min(20),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = clinicUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form geçersiz", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";
    const updated = await prisma.clinic.update({
      where: { slug },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (err) {
    console.error("[POST /api/settings/clinic]", err);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
