// Email provider abstraction.
//
// Every provider (Resend, SendGrid, Mailgun, Brevo, Postmark, SES) implements
// this interface. The rest of the app (queue workers, campaign sender,
// transactional emails) only ever talks to `EmailProvider` — swapping the
// provider used in production is a one-line change in getEmailProvider()
// and never requires touching campaign/queue logic.

export interface SendEmailInput {
  to: string;
  from: { name: string; email: string };
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content?: string; path?: string }[];
  idempotencyKey?: string;
  // Used to correlate provider webhook events back to a CampaignRecipient.
  metadata?: Record<string, string>;
}

export interface SendEmailResult {
  providerMessageId: string;
  accepted: boolean;
  error?: string;
}

export interface EmailProvider {
  name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
  /**
   * Verifies an inbound webhook signature came from this provider before
   * any event data is trusted or written to the database.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}
