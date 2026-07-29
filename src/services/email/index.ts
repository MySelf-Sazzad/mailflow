import { ResendProvider } from "./providers/resend";
import type { EmailProvider } from "./provider";
import { LocalEmailProvider } from "./providers/local";

// Add new providers here as they're implemented:
//   sendgrid -> SendGridProvider
//   mailgun  -> MailgunProvider
//   brevo    -> BrevoProvider
//   postmark -> PostmarkProvider
//   ses      -> SesProvider
//
// The active provider is read from the EMAIL_PROVIDER env var, which the
// admin "Email Provider Management" screen writes to SiteSetting at runtime
// (falling back to env for local dev). See src/lib/limits.ts for the same
// pattern applied to plan limits.
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      return new LocalEmailProvider();
    case "resend":
    default:
      return new ResendProvider(
        process.env.RESEND_API_KEY ?? "",
        process.env.EMAIL_WEBHOOK_SECRET ?? ""
      );
  }
}

export type { EmailProvider, SendEmailInput, SendEmailResult } from "./provider";
