import { getEmailProvider } from "./index";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const APP_NAME = process.env.APP_NAME ?? "MailFlow";
const SENDER_EMAIL = process.env.DEFAULT_SENDER_EMAIL ?? "no-reply@example.com";

export async function sendVerificationEmail(to: string, fullName: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  const provider = getEmailProvider();

  return provider.send({
    to,
    from: { name: APP_NAME, email: SENDER_EMAIL },
    subject: `Verify your ${APP_NAME} account`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Welcome to ${APP_NAME}. Confirm your email address to activate your account and start sending campaigns.</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
    text: `Verify your ${APP_NAME} account: ${link}`,
  });
}

export async function sendPasswordResetEmail(to: string, fullName: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  const provider = getEmailProvider();

  return provider.send({
    to,
    from: { name: APP_NAME, email: SENDER_EMAIL },
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>We received a request to reset your password. This link expires in 1 hour.</p>
      <p><a href="${link}">Reset my password</a></p>
      <p>If you didn't request this, you can safely ignore this email — your password will not change.</p>
    `,
    text: `Reset your ${APP_NAME} password: ${link}`,
  });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
