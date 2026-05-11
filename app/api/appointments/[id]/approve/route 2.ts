import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  sendSms,
  SmsTemplates,
  WhatsAppTemplates,
} from "@/lib/sms";
import { toE164TR, formatTRDate } from "@/lib/utils";

/**
 * POST /api/appointments/[id]/approve
 *
 * Sekreter randevuyu onayladığında çağrılır.
 *   1. Auth kontrolü
 *   2. Randevu durumu APPROVED'a alınır
 *   3. WhatsApp template (varsa) veya SMS gönderilir
 *   4. SmsLog kaydı (kanal bilgisiyle)
 *
 * Idempotent: zaten APPROVED ise hata DEĞİL, mevcut durumu döner.
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let appointmentId: string | undefined;

  try {
    // 0. Auth
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    appointmentId = id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { clinic: true, service: true, dietician: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    if (appointment.status === "APPROVED") {
      return NextResponse.json({
        success: true,
        alreadyApproved: true,
        appointment: {
          id: appointment.id,
          status: appointment.status,
          approvedAt: appointment.approvedAt,
        },
      });
    }

    if (appointment.status !== "PENDING") {
      return NextResponse.json(
        { message: `Randevu "${appointment.status}" durumunda — onaylanamaz` },
        { status: 409 }
      );
    }

    // 2. Atomic onay güncellemesi
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: session.user.id ?? null,
      },
    });

    // 3. Mesaj hazırlığı — hem template hem fallback text
    const dieticianName = appointment.dietician
      ? `${appointment.dietician.title} ${appointment.dietician.fullName}`
      : appointment.service.name;

    const dateText = formatTRDate(appointment.requestedAt);

    const fallbackText = SmsTemplates.appointmentApproved({
      patientName: appointment.patientName,
      doctorName: dieticianName,
      dateText,
      clinicPhone: appointment.clinic.phone,
    });

    const whatsappTemplate = WhatsAppTemplates.appointmentApproved({
      patientName: appointment.patientName,
      doctorName: dieticianName,
      dateText,
      clinicPhone: appointment.clinic.phone,
    });

    // 4. Mesaj gönder (WhatsApp birincil ise template kullanılır)
    let smsSuccess = false;
    let smsMessageId: string | undefined;
    let smsError: string | undefined;
    let smsCost: number | undefined;
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
      smsCost = result.cost;
      smsChannel = result.channel;
    } catch (smsErr) {
      smsSuccess = false;
      smsError =
        smsErr instanceof Error
          ? smsErr.message
          : "Mesaj sağlayıcısına ulaşılamadı";
    }

    // 5. SmsLog kaydı (kanal bilgisi dahil)
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
          cost: smsCost ?? null,
          sentAt: smsSuccess ? new Date() : null,
        },
      });
    } catch (logErr) {
      console.error("[approve] MessageLog kayıt hatası:", logErr);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt,
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

    console.error("[POST /api/appointments/[id]/approve]", {
      appointmentId,
      error: err,
    });

    return NextResponse.json(
      {
        message: "Onay işlemi sırasında hata oluştu",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
