import type { SmsProvider, SmsMessage, SmsResult, MessageChannel } from "../types";

/**
 * Geliştirme ortamı için Mock sağlayıcı.
 * Konsola log basar, gerçek mesaj göndermez.
 */
export class MockSmsProvider implements SmsProvider {
  readonly name = "MOCK" as const;
  readonly channel: MessageChannel = "SMS";

  async send(message: SmsMessage): Promise<SmsResult> {
    console.log("\n[MOCK MSG] ────────────────────────────");
    console.log(`[MOCK MSG] Alıcı : ${message.to}`);
    if (message.template) {
      console.log(
        `[MOCK MSG] Template: ${message.template.name} (${message.template.language})`
      );
      const paramsStr = message.template.bodyParameters
        .map((p) => `{{${p.name}}}=${p.value}`)
        .join(" | ");
      console.log(`[MOCK MSG] Params  : ${paramsStr}`);
    }
    console.log(`[MOCK MSG] Body  : ${message.body}`);
    if (message.appointmentId) {
      console.log(`[MOCK MSG] Randevu: ${message.appointmentId}`);
    }
    console.log("[MOCK MSG] ────────────────────────────\n");

    await new Promise((r) => setTimeout(r, 150));

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      channel: this.channel,
      cost: 0.15,
    };
  }

  async sendBatch(messages: SmsMessage[]): Promise<SmsResult[]> {
    return Promise.all(messages.map((m) => this.send(m)));
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
