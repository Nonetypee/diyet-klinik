import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  sendSms,
  SmsTemplates,
  WhatsAppTemplates,
} from "@/lib/sms";
import { toE164TR, formatTRDate } from "@/lib/utils";

const rejectSchema = z.object({
  reason: z.string().min(3, "Red sebebi gerekli").max(500),
  alternativeSlot: z.string().datetime().optional(),
});

/**
 * POST /api/appointments/[id]/reject
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let appointmentId: string | undefined;

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await context.params;
    appointmentId = id;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Geçersiz JSON gövdesi" },
        { status: 400 }
      );
    }

    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Form geçersiz",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { clinic: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    if (appointment.status === "REJECTED") {
      return NextResponse.json({ success: true, alreadyRejected: true });
    }

    if (
      appointment.status !== "PENDING" &&
      appointment.status !== "APPROVED"
    ) {
      return NextResponse.json(
        { message: `Randevu "${appointment.status}" durumunda — reddedilemez` },
        { status: 409 }
      );
    }

    const alternative = parsed.data.alternativeSlot
      ? new Date(parsed.data.alternativeSlot)
      : null;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.reason,
        alternativeSlot: alternative,
      },
    });

    const altText = alternative ? formatTRDate(alternative) : undefined;

    const fallbackText = SmsTemplates.appointmentRejected({
      patientName: appointment.patientName,
      reason: parsed.data.reason,
      alternativeDateText: altText,
      clinicPhone: appointment.clinic.phone,
    });

    const whatsappTemplate = WhatsAppTemplates.appointmentRejected({
      patientName: appointment.patientName,
      reason: parsed.data.reason,
      alternativeDateText: altText,
      clinicPhone: appointment.clinic.phone,
    });

    let smsSuccess = false;
    let smsMessageId: string | undefined;
    let smsError: string | undefined;
    let smsChannel: string | undefined;

    try {
      const result = await sendSms({
        to: toE164TR(appointment.patientPhone),
        body: fallbackText,
        template: whatsappTemplate,
        appointmentId: appointment.id,
      });
      smsSuccess = result.success;
      smsMessageId = result.messageId;
      smsError = result.error;
      smsChannel = result.channel;
    } catch (smsErr) {
      smsSuccess = false;
      smsError =
        smsErr instanceof Error
          ? smsErr.message
          : "Mesaj sağlayıcısına ulaşılamadı";
    }

    try {
      await prisma.smsLog.create({
        data: {
          appointmentId: appointment.id,
          provider:
            smsChannel ?? (process.env.MESSAGING_PROVIDER ?? "MOCK").toUpperCase(),
          toPhone: appointment.patientPhone,
          message: fallbackText,
          status: smsSuccess ? "SENT" : "FAILED",
          providerMessageId: smsMessageId ?? null,
          errorMessage: smsError ?? null,
          sentAt: smsSuccess ? new Date() : null,
        },
      });
    } catch (logErr) {
      console.error("[reject] MessageLog kayıt hatası:", logErr);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: updated.id,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
        alternativeSlot: updated.alternativeSlot,
      },
      message: {
        sent: smsSuccess,
        channel: smsChannel ?? null,
        error: smsError ?? null,
      },
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Bilinmeyen sunucu hatası";

    console.error("[POST /api/appointments/[id]/reject]", {
      appointmentId,
      error: err,
    });

    return NextResponse.json(
      {
        message: "Red işlemi sırasında hata oluştu",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
