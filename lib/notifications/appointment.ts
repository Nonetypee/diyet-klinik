import { prisma } from "@/lib/db";
import { sendSms, SmsTemplates, type SmsResult } from "@/lib/sms";
import { toE164TR, formatTRDate } from "@/lib/utils";

/**
 * Randevu onaylandığında SMS gönderir ve SmsLog kaydı oluşturur.
 */
export async function sendApprovalSms(appointmentId: string): Promise<SmsResult> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { clinic: true, dietician: true, service: true },
  });
  if (!appt) throw new Error("Randevu bulunamadı");

  const dieticianName = appt.dietician
    ? `${appt.dietician.title} ${appt.dietician.fullName}`
    : appt.service.name;

  const message = SmsTemplates.appointmentApproved({
    patientName: appt.patientName,
    doctorName: dieticianName,
    dateText: formatTRDate(appt.requestedAt),
    clinicPhone: appt.clinic.phone,
  });

  const result = await sendSms({
    to: toE164TR(appt.patientPhone),
    body: message,
    appointmentId: appt.id,
  });

  await prisma.smsLog.create({
    data: {
      appointmentId: appt.id,
      provider: process.env.SMS_PROVIDER ?? "MOCK",
      toPhone: appt.patientPhone,
      message,
      status: result.success ? "SENT" : "FAILED",
      providerMessageId: result.messageId,
      errorMessage: result.error,
      cost: result.cost,
      sentAt: result.success ? new Date() : null,
    },
  });

  return result;
}

/**
 * Randevu reddedildiğinde SMS gönderir.
 */
export async function sendRejectionSms(
  appointmentId: string,
  reason: string,
  alternative?: Date
): Promise<SmsResult> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { clinic: true },
  });
  if (!appt) throw new Error("Randevu bulunamadı");

  const message = SmsTemplates.appointmentRejected({
    patientName: appt.patientName,
    reason,
    alternativeDateText: alternative ? formatTRDate(alternative) : undefined,
    clinicPhone: appt.clinic.phone,
  });

  const result = await sendSms({
    to: toE164TR(appt.patientPhone),
    body: message,
    appointmentId: appt.id,
  });

  await prisma.smsLog.create({
    data: {
      appointmentId: appt.id,
      provider: process.env.SMS_PROVIDER ?? "MOCK",
      toPhone: appt.patientPhone,
      message,
      status: result.success ? "SENT" : "FAILED",
      providerMessageId: result.messageId,
      errorMessage: result.error,
      sentAt: result.success ? new Date() : null,
    },
  });

  return result;
}
