import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { appointmentRequestSchema } from "@/lib/validation/appointment";

/**
 * POST /api/appointments
 * Yeni randevu talebi oluşturur. Status = PENDING.
 *
 * Form, hizmeti `serviceSlug` ile gönderir (örn: "kilo-yonetimi").
 * Backend bu slug'ı Service tablosundaki gerçek ID ile eşleştirir.
 *
 * Bu endpoint PUBLIC — auth gerektirmez (landing page'den çağrılır).
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = appointmentRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Form bilgileri geçersiz",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const requestedAt = new Date(`${data.requestedDate}T${data.requestedTime}:00`);

    if (Number.isNaN(requestedAt.getTime())) {
      return NextResponse.json(
        { message: "Geçersiz tarih/saat" },
        { status: 400 }
      );
    }

    if (requestedAt.getTime() < Date.now()) {
      return NextResponse.json(
        { message: "Geçmiş tarihe randevu oluşturulamaz" },
        { status: 400 }
      );
    }

    // Klinik ve hizmeti tek seferde çek
    const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";
    const [clinic, service, dietician] = await Promise.all([
      prisma.clinic.findUnique({ where: { slug } }),
      prisma.service.findUnique({ where: { slug: data.serviceSlug } }),
      prisma.dietician.findFirst({ where: { isActive: true } }),
    ]);

    if (!clinic) {
      return NextResponse.json(
        {
          message:
            "Klinik bulunamadı. `npm run db:seed` çalıştırdığınızdan emin olun.",
        },
        { status: 500 }
      );
    }
    if (!service) {
      return NextResponse.json(
        { message: `"${data.serviceSlug}" adlı hizmet bulunamadı` },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      undefined;

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        serviceId: service.id,
        dieticianId: dietician?.id ?? null,
        patientName: data.patientName.trim(),
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail || null,
        patientNote: data.patientNote || null,
        requestedAt,
        status: "PENDING",
        kvkkConsent: data.kvkkConsent,
        kvkkConsentAt: data.kvkkConsent ? new Date() : null,
        source: "WEB",
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    return NextResponse.json(
      { id: appointment.id, status: appointment.status },
      { status: 201 }
    );
  } catch (err) {
    // Dev modda gerçek hatayı göster
    const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error("[POST /api/appointments]", err);
    return NextResponse.json(
      {
        message: "Sunucu hatası, lütfen tekrar deneyiniz",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/appointments?status=PENDING
 * Admin paneli için listeleme.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            requestedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { dietician: true, service: true },
    orderBy: { requestedAt: "asc" },
    take: 200,
  });

  return NextResponse.json(appointments);
}
