import { Queue } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";

const useRedis = process.env.QUEUE_PROVIDER === "redis";
const connection = useRedis ? new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null }) : null;

export interface CampaignRecipientJob {
  campaignId: string;
  campaignRecipientId: string;
  // Idempotency key prevents double-sending if a job is retried after the
  // provider actually accepted it (e.g. network timeout on our side after
  // the provider already returned 200).
  idempotencyKey: string;
}

export const campaignQueue = connection ? new Queue<CampaignRecipientJob>("campaign-send", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false, // failed jobs stay for the dead-letter review UI
  },
}) : null;

/**
 * Enqueues one job per recipient — never a single job with a recipient
 * array. Each recipient gets their own provider call and their own `to`
 * field, so recipients can never see each other's addresses (rule #1/#2).
 */
export async function enqueueCampaign(campaignId: string, recipientIds: string[]) {
  if (!campaignQueue) {
    await prisma.queueJob.createMany({ data: recipientIds.map((campaignRecipientId) => ({
      jobType: "campaign-send", payload: { campaignId, campaignRecipientId, idempotencyKey: `${campaignId}:${campaignRecipientId}` }, maxAttempts: 5,
    })) });
    return;
  }
  const jobs = recipientIds.map((campaignRecipientId) => ({
    name: "send-to-recipient",
    data: {
      campaignId,
      campaignRecipientId,
      idempotencyKey: `${campaignId}:${campaignRecipientId}`,
    },
    opts: {
      jobId: `${campaignId}:${campaignRecipientId}`, // BullMQ dedupes on jobId
    },
  }));

  await campaignQueue.addBulk(jobs);
}
