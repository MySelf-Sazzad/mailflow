import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { mergeFields } from "@/lib/personalize";
import { signedToken } from "@/lib/security";
import { getEmailProvider } from "@/services/email";
import type { CampaignRecipientJob } from "@/services/queue/campaignQueue";

export async function sendCampaignRecipient(data: CampaignRecipientJob) {
  const recipient = await prisma.campaignRecipient.findUnique({ where: { id: data.campaignRecipientId }, include: { campaign: { include: { attachments: { include: { fileAsset: true } } } }, contact: true } });
  if (!recipient || ["SENT", "DELIVERED", "OPENED", "CLICKED"].includes(recipient.status)) return;
  const suppressed = await prisma.suppressionEntry.findUnique({ where: { userId_email: { userId: recipient.campaign.userId, email: recipient.recipientEmail } } });
  if (suppressed) { await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "UNSUBSCRIBED" } }); await refreshCampaign(recipient.campaignId); return; }

  const merge = recipient.contact ?? { email: recipient.recipientEmail };
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const token = signedToken(recipient.id);
  const footer = `<p style="font-size:12px;color:#64748b;margin-top:32px">Sent with MailFlow. <a href="${appUrl}/unsubscribe/${recipient.id}?token=${token}">Unsubscribe</a></p>`;
  const html = mergeFields(recipient.campaign.htmlContent, merge) + footer;
  const attachments = await Promise.all(recipient.campaign.attachments.map(async ({ fileAsset }) => {
    if ((process.env.STORAGE_PROVIDER ?? "local") === "local") {
      const content = await readFile(path.join(process.cwd(), ".data", "uploads", ...fileAsset.storageKey.split("/")));
      return { filename: fileAsset.fileName, content: content.toString("base64") };
    }
    return { filename: fileAsset.fileName, path: fileAsset.storageUrl };
  }));
  const result = await getEmailProvider().send({ to: recipient.recipientEmail, from: { name: recipient.campaign.senderName, email: process.env.DEFAULT_SENDER_EMAIL ?? recipient.campaign.senderEmail }, replyTo: recipient.campaign.replyToEmail ?? undefined, subject: recipient.personalizedSubject ?? mergeFields(recipient.campaign.subject, merge), html, text: recipient.campaign.plainTextContent ?? undefined, attachments, idempotencyKey: data.idempotencyKey, metadata: { campaignRecipientId: recipient.id } });
  if (!result.accepted) throw new Error(result.error ?? "Provider rejected email");
  await prisma.$transaction([
    prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "SENT", sentAt: new Date(), providerMessageId: result.providerMessageId, errorMessage: null } }),
    prisma.campaign.update({ where: { id: recipient.campaignId }, data: { sentCount: { increment: 1 }, status: "PROCESSING", startedAt: recipient.campaign.startedAt ?? new Date() } }),
    prisma.subscription.update({ where: { userId: recipient.campaign.userId }, data: { emailsSentToday: { increment: 1 }, emailsSentThisMonth: { increment: 1 } } }),
    prisma.emailEvent.create({ data: { campaignRecipientId: recipient.id, type: "SENT", providerEventId: `sent:${result.providerMessageId}` } }),
  ]);
  await refreshCampaign(recipient.campaignId);
}

export async function refreshCampaign(campaignId: string) {
  const grouped = await prisma.campaignRecipient.groupBy({ by: ["status"], where: { campaignId }, _count: true });
  const active = grouped.some((group) => ["PENDING", "QUEUED"].includes(group.status));
  if (!active) {
    const failures = grouped.filter((group) => ["FAILED", "BOUNCED"].includes(group.status)).reduce((count, group) => count + group._count, 0);
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: failures ? "PARTIALLY_COMPLETED" : "COMPLETED", failureCount: failures, completedAt: new Date() } });
  }
}
