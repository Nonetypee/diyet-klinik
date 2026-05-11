import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendSms, SmsTemplates, WhatsAppTemplates } from "@/lib/sms";
import { recordTestResult } from "@/lib/messaging-config";
import { toE164TR, formatTRDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  testPhone: z.string().min(10, "Geçerli bir telefon numarası girin"),
});

/**
 * POST /api/settings/messaging/test
 *
 * Belirtilen telefona test mesajı gönderir. Mevcut yapılandırma kullanılır.
 * Sonuç MessagingConfig.lastTest* alanlarına kaydedilir (UI gösterir).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Telefon numarası eksik" },
        { status: 400 }
      );
    }

    const testName = session.user.name ?? "Yönetici";
    const dateText = formatTRDate(new Date());
    const dummyPhone = "+90 555 000 00 00";

    // WhatsApp template'i de SMS metni de "test mesajı" şeklinde
    const fallbackText = SmsTemplates.appointmentApproved({
      patientName: testName,
      doctorName: "TEST",
      dateText,
      clinicPhone: dummyPhone,
    });

    const template = WhatsAppTemplates.appointmentApproved({
      patientName: testName,
      doctorName: "TEST",
      dateText,
      clinicPhone: dummyPhone,
    });

    const result = await sendSms({
      to: toE164TR(parsed.data.testPhone),
      body: fallbackText,
      template,
      appointmentId: "TEST",
    });

    await recordTestResult({
      status: result.success ? "OK" : "FAILED",
      channel: result.channel ?? null,
      error: result.error ?? null,
    });

    return NextResponse.json({
      success: result.success,
      channel: result.channel ?? null,
      messageId: result.messageId ?? null,
      error: result.error ?? null,
    });
  } catch (err) {
    console.error("[POST /api/settings/messaging/test]", err);

    // Test başarısız ama yine de loglamak istiyoruz
    try {
      await recordTestResult({
        status: "FAILED",
        channel: null,
        error: err instanceof Error ? err.message : "Bilinmeyen hata",
      });
    } catch {
      // ignore
    }

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Test mesajı gönderilemedi",
      },
      { status: 500 }
    );
  }
}
