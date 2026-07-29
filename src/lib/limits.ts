import { prisma } from "@/lib/prisma";

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Single source of truth for "can this user do X". Every campaign send,
 * contact import, and file upload must call through here rather than
 * re-implementing plan checks inline — this is what keeps limits
 * admin-configurable instead of hard-coded across the app (rule #4/#5
 * in the product spec).
 */
export async function checkCampaignSendAllowed(userId: string, recipientCount: number): Promise<LimitCheckResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, status: true } });
  if (user?.role === "SUPER_ADMIN" && user.status === "ACTIVE") return { allowed: true };
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription) {
    return { allowed: false, reason: "No active subscription found." };
  }

  if (subscription.status === "SUSPENDED") {
    return { allowed: false, reason: "Your account is suspended. Contact support." };
  }

  if (subscription.status === "EXPIRED" || subscription.status === "CANCELLED") {
    return { allowed: false, reason: "Your subscription has expired. Renew to continue sending." };
  }

  if (subscription.currentPeriodEnd < new Date() && subscription.status !== "TRIAL") {
    return { allowed: false, reason: "Your subscription period has ended." };
  }

  const { plan } = subscription;

  if (recipientCount > plan.recipientsPerCampaign) {
    return {
      allowed: false,
      reason: `Your current plan allows a maximum of ${plan.recipientsPerCampaign} recipients per campaign.`,
    };
  }

  maybeResetUsageWindow(subscription);

  if (subscription.emailsSentToday + recipientCount > plan.emailsPerDay) {
    return {
      allowed: false,
      reason: `Sending this campaign would exceed your daily limit of ${plan.emailsPerDay} emails.`,
    };
  }

  if (subscription.emailsSentThisMonth + recipientCount > plan.emailsPerMonth) {
    return {
      allowed: false,
      reason: `Sending this campaign would exceed your monthly limit of ${plan.emailsPerMonth} emails.`,
    };
  }

  return { allowed: true };
}

export async function checkStorageAllowed(userId: string, additionalBytes: number): Promise<LimitCheckResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!subscription) return { allowed: false, reason: "No active subscription found." };

  const used = await prisma.fileAsset.aggregate({
    where: { userId },
    _sum: { sizeBytes: true },
  });

  const usedMb = (used._sum.sizeBytes ?? 0) / (1024 * 1024);
  const additionalMb = additionalBytes / (1024 * 1024);

  if (usedMb + additionalMb > subscription.plan.storageLimitMb) {
    return {
      allowed: false,
      reason: `This upload would exceed your plan's ${subscription.plan.storageLimitMb} MB storage limit.`,
    };
  }

  return { allowed: true };
}

// Resets the daily/monthly counters when the tracked window has rolled over.
// Called lazily on read rather than via a cron, so it stays correct even if
// a scheduled reset job is delayed or missed.
function maybeResetUsageWindow(subscription: { id: string; usageResetAt: Date; emailsSentToday: number; emailsSentThisMonth: number }) {
  const now = new Date();
  const last = subscription.usageResetAt;

  const isNewDay = now.toDateString() !== last.toDateString();
  const isNewMonth = now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear();

  if (isNewDay) subscription.emailsSentToday = 0;
  if (isNewMonth) subscription.emailsSentThisMonth = 0;

  if (isNewDay || isNewMonth) {
    // Fire-and-forget persist; caller already has the in-memory corrected values.
    void prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        emailsSentToday: subscription.emailsSentToday,
        emailsSentThisMonth: subscription.emailsSentThisMonth,
        usageResetAt: now,
      },
    });
  }
}
