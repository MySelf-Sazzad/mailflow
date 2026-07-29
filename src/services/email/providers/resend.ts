import crypto from "node:crypto";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "../provider";

// Minimal Resend REST integration (no SDK dependency needed).
// https://resend.com/docs/api-reference/emails/send-email
export class ResendProvider implements EmailProvider {
  name = "resend";
  private apiKey: string;
  private webhookSecret: string;

  constructor(apiKey: string, webhookSecret: string) {
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (!this.apiKey) {
      return { providerMessageId: "", accepted: false, error: "RESEND_API_KEY not configured" };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from: `${input.from.name} <${input.from.email}>`,
          to: [input.to],
          reply_to: input.replyTo,
          subject: input.subject,
          html: input.html,
          text: input.text,
          attachments: input.attachments,
          tags: input.metadata
            ? Object.entries(input.metadata).map(([name, value]) => ({ name, value }))
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { providerMessageId: "", accepted: false, error: data?.message ?? "Send failed" };
      }

      return { providerMessageId: data.id, accepted: true };
    } catch (err) {
      return {
        providerMessageId: "",
        accepted: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  // Resend signs webhooks with an HMAC in the `svix-signature` header
  // (Svix-compatible format: "v1,<base64 hmac>").
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !this.webhookSecret) return false;
    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("base64");
    const provided = signatureHeader.split(",")[1] ?? "";
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  }
}
