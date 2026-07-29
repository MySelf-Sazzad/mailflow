import "dotenv/config";
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getEmailProvider } from "@/services/email";
import { mergeFields } from "@/lib/personalize";
import { signedToken } from "@/lib/security";
import { recordEmailEvent } from "@/lib/emailEvents";
import type { CampaignRecipientJob } from "@/services/queue/campaignQueue";

async function processJob(data: CampaignRecipientJob) {
  const recipient = await prisma.campaignRecipient.findUnique({ where: { id: data.campaignRecipientId }, include: { campaign: { include: { attachments: { include: { fileAsset: true } } } }, contact: true } });
  if (!recipient || ["SENT", "DELIVERED", "OPENED", "CLICKED"].includes(recipient.status)) return;
  const suppressed = await prisma.suppressionEntry.findUnique({ where: { userId_email: { userId: recipient.campaign.userId, email: recipient.recipientEmail } } });
  if (suppressed) { await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "UNSUBSCRIBED" } }); return; }

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

async function refreshCampaign(campaignId: string) {
  const grouped = await prisma.campaignRecipient.groupBy({ by: ["status"], where: { campaignId }, _count: true });
  const active = grouped.some((g) => ["PENDING", "QUEUED"].includes(g.status));
  if (!active) {
    const failures = grouped.filter((g) => ["FAILED", "BOUNCED"].includes(g.status)).reduce((n, g) => n + g._count, 0);
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: failures ? "PARTIALLY_COMPLETED" : "COMPLETED", failureCount: failures, completedAt: new Date() } });
  }
}

async function runDatabaseQueue() {
  // A process can stop after claiming a job. Recover stale claims; Resend's
  // idempotency key makes retrying safe without delivering a duplicate.
  await prisma.queueJob.updateMany({ where: { status: "ACTIVE", updatedAt: { lt: new Date(Date.now() - 2 * 60_000) } }, data: { status: "FAILED", lastError: "Recovered after an interrupted worker" } });
  const scheduled = await prisma.campaign.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } }, include: { recipients: { where: { status: "QUEUED" } } }, take: 10 });
  for (const campaign of scheduled) await prisma.queueJob.createMany({ data: campaign.recipients.map((r) => ({ jobType: "campaign-send", payload: { campaignId: campaign.id, campaignRecipientId: r.id, idempotencyKey: `${campaign.id}:${r.id}` } })) });
  if (scheduled.length) await prisma.campaign.updateMany({ where: { id: { in: scheduled.map((c) => c.id) } }, data: { status: "QUEUED" } });
  const jobs = await prisma.queueJob.findMany({ where: { status: { in: ["PENDING", "FAILED"] }, attempts: { lt: 5 } }, orderBy: { createdAt: "asc" }, take: 20 });
  for (const row of jobs) {
    await prisma.queueJob.update({ where: { id: row.id }, data: { status: "ACTIVE", attempts: { increment: 1 } } });
    try { await processJob(row.payload as unknown as CampaignRecipientJob); await prisma.queueJob.update({ where: { id: row.id }, data: { status: "COMPLETED" } }); }
    catch (error) { const final = row.attempts + 1 >= row.maxAttempts; await prisma.queueJob.update({ where: { id: row.id }, data: { status: final ? "DEAD_LETTER" : "FAILED", lastError: error instanceof Error ? error.message : "Unknown error" } }); }
  }
  await syncResendDeliveryStatus();
}

async function syncResendDeliveryStatus() {
  if (process.env.EMAIL_PROVIDER !== "resend" || !process.env.RESEND_API_KEY) return;
  const recipients = await prisma.campaignRecipient.findMany({ where: { status: { in: ["SENT", "DELIVERED"] }, providerMessageId: { not: null } }, select: { id: true, providerMessageId: true }, take: 20, orderBy: { sentAt: "desc" } });
  for (const recipient of recipients) {
    try {
      const response = await fetch(`https://api.resend.com/emails/${recipient.providerMessageId}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) continue;
      const email = await response.json() as { last_event?: string };
      const event = email.last_event === "failed" ? "rejected" : email.last_event;
      if (["delivered", "opened", "clicked", "bounced", "complained", "rejected"].includes(event ?? "")) await recordEmailEvent(recipient.id, event!, `resend-sync:${recipient.providerMessageId}:${event}`, email);
    } catch { /* the next polling cycle retries status synchronization */ }
  }
}

if (process.env.QUEUE_PROVIDER === "redis") {
  const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
  new Worker<CampaignRecipientJob>("campaign-send", (job: Job<CampaignRecipientJob>) => processJob(job.data), { connection, concurrency: 10, limiter: { max: 50, duration: 1000 } });
  console.log("MailFlow Redis worker started");
} else {
  console.log("MailFlow free database worker started");
  void runDatabaseQueue();
  setInterval(() => void runDatabaseQueue(), 3000);
}
