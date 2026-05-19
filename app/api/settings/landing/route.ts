import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { canEditLanding, normalizeRole } from "@/lib/permissions";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/u, "Geçerli bir hex renk olmalı (#RRGGBB)");

const trustSignalSchema = z.object({
  icon: z.string().min(1),
  text: z.string().min(1),
});

const trustPillarSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

const trustStatSchema = z.tuple([z.string().min(1), z.string().min(1)]);

const howStepSchema = z.object({
  number: z.string().min(1),
  icon: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

const faqItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

const landingSchema = z.object({
  primaryColor: hexColor,
  primaryColorDark: hexColor,
  accentColor: hexColor,
  darkBgColor: hexColor,
  heroBadge: z.string(),
  heroTitlePart1: z.string(),
  heroTitleAccent: z.string(),
  heroTitlePart2: z.string(),
  heroSubtitle: z.string(),
  heroCtaPrimary: z.string(),
  heroCtaSecondary: z.string(),
  heroTrustSignals: z.array(trustSignalSchema),
  trustBadge: z.string(),
  trustTitle: z.string(),
  trustSubtitle: z.string(),
  trustPillars: z.array(trustPillarSchema),
  trustStats: z.array(trustStatSchema),
  servicesBadge: z.string(),
  servicesTitle: z.string(),
  servicesSubtitle: z.string(),
  howBadge: z.string(),
  howTitle: z.string(),
  howSubtitle: z.string(),
  howSteps: z.array(howStepSchema),
  bookingBadge: z.string(),
  bookingTitle: z.string(),
  bookingSubtitle: z.string(),
  faqBadge: z.string(),
  faqTitle: z.string(),
  faqItems: z.array(faqItemSchema),
  ctaTitle: z.string(),
  ctaSubtitle: z.string(),
  ctaPrimary: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!canEditLanding(normalizeRole(user?.role))) {
    return NextResponse.json(
      { message: "Bu işlem için yetkiniz yok (sadece Developer)." },
      { status: 403 }
    );
  }

  try {
    const json = await req.json();
    const parsed = landingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Form geçersiz",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await prisma.landingContent.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        ...data,
        heroTrustSignals: JSON.stringify(data.heroTrustSignals),
        trustPillars: JSON.stringify(data.trustPillars),
        trustStats: JSON.stringify(data.trustStats),
        howSteps: JSON.stringify(data.howSteps),
        faqItems: JSON.stringify(data.faqItems),
      },
      update: {
        ...data,
        heroTrustSignals: JSON.stringify(data.heroTrustSignals),
        trustPillars: JSON.stringify(data.trustPillars),
        trustStats: JSON.stringify(data.trustStats),
        howSteps: JSON.stringify(data.howSteps),
        faqItems: JSON.stringify(data.faqItems),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/settings/landing]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
