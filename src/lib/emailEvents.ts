import type { EmailEventType, RecipientStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const mapping: Record<string, { event: EmailEventType; status: RecipientStatus; counter?: "deliveredCount" | "openCount" | "clickCount" | "bounceCount" | "failureCount" }> = {
  delivered: { event: "DELIVERED", status: "DELIVERED", counter: "deliveredCount" }, opened: { event: "OPENED", status: "OPENED", counter: "openCount" }, clicked: { event: "CLICKED", status: "CLICKED", counter: "clickCount" },
  bounced: { event: "HARD_BOUNCED", status: "BOUNCED", counter: "bounceCount" }, complained: { event: "COMPLAINED", status: "COMPLAINED", counter: "failureCount" }, rejected: { event: "REJECTED", status: "FAILED", counter: "failureCount" },
};
export async function recordEmailEvent(recipientId: string, type: string, providerEventId: string, metadata?: object) {
  const m = mapping[type]; if (!m) return false;
  const recipient = await prisma.campaignRecipient.findUnique({ where: { id: recipientId }, include: { campaign: true } }); if (!recipient) return false;
  const existing = await prisma.emailEvent.findUnique({ where: { providerEventId } }); if (existing) return true;
  const dateField = m.status === "DELIVERED" ? { deliveredAt: new Date() } : m.status === "OPENED" ? { openedAt: new Date() } : m.status === "CLICKED" ? { clickedAt: new Date() } : m.status === "BOUNCED" ? { bouncedAt: new Date() } : {};
  await prisma.$transaction([
    prisma.emailEvent.create({ data: { campaignRecipientId: recipientId, type: m.event, providerEventId, metadata: metadata ?? {} } }),
    prisma.campaignRecipient.update({ where: { id: recipientId }, data: { status: m.status, ...dateField } }),
    ...(m.counter ? [prisma.campaign.update({ where: { id: recipient.campaignId }, data: { [m.counter]: { increment: 1 } } })] : []),
  ]);
  if (["BOUNCED", "COMPLAINED"].includes(m.status)) await prisma.suppressionEntry.upsert({ where: { userId_email: { userId: recipient.campaign.userId, email: recipient.recipientEmail } }, update: { reason: m.status === "BOUNCED" ? "HARD_BOUNCE" : "COMPLAINT" }, create: { userId: recipient.campaign.userId, email: recipient.recipientEmail, reason: m.status === "BOUNCED" ? "HARD_BOUNCE" : "COMPLAINT" } });
  return true;
}
