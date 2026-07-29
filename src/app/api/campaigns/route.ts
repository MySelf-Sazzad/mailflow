import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { mergeFields, stripHtml } from "@/lib/personalize";
import { checkCampaignSendAllowed } from "@/lib/limits";
import { enqueueCampaign } from "@/services/queue/campaignQueue";
import { refreshCampaign, sendCampaignRecipient } from "@/services/email/campaignSender";

const schema = z.object({
  name: z.string().min(2).max(120), subject: z.string().min(1).max(200), previewText: z.string().max(200).optional(),
  senderName: z.string().min(2).max(100), senderEmail: z.email(), replyToEmail: z.email().optional().or(z.literal("")),
  htmlContent: z.string().min(1).max(200000), recipients: z.array(z.email()).min(1).max(5000), attachmentIds: z.array(z.string()).default([]),
  sendNow: z.boolean().default(false), permissionConfirmed: z.boolean().default(false),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const campaigns = await prisma.campaign.findMany({ where: { userId: user.id, deletedAt: null, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 50 });
    return Response.json({ campaigns });
  } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json());
    const emails = [...new Set(input.recipients.map((e) => e.toLowerCase()))];
    const [contacts, suppressed, ownedFiles] = await Promise.all([
      prisma.contact.findMany({ where: { userId: user.id, email: { in: emails }, status: "SUBSCRIBED", deletedAt: null } }),
      prisma.suppressionEntry.findMany({ where: { userId: user.id, email: { in: emails } }, select: { email: true } }),
      prisma.fileAsset.findMany({ where: { userId: user.id, id: { in: input.attachmentIds } }, select: { id: true } }),
    ]);
    const blocked = new Set(suppressed.map((s) => s.email));
    const contactMap = new Map(contacts.map((c) => [c.email, c]));
    const allowed = emails.filter((e) => !blocked.has(e));
    if (input.sendNow) {
      if (!input.permissionConfirmed) return Response.json({ error: "Confirm you have permission to contact these recipients." }, { status: 422 });
      const limit = await checkCampaignSendAllowed(user.id, allowed.length);
      if (!limit.allowed) return Response.json({ error: limit.reason }, { status: 422 });
      if (process.env.VERCEL && (process.env.STORAGE_PROVIDER ?? "local") === "local" && input.attachmentIds.length) return Response.json({ error: "Attachments require S3 storage when deployed on Vercel." }, { status: 422 });
    }
    const campaign = await prisma.campaign.create({ data: {
      userId: user.id, name: input.name, subject: input.subject, previewText: input.previewText, senderName: input.senderName,
      senderEmail: input.senderEmail, replyToEmail: input.replyToEmail || null, htmlContent: input.htmlContent, plainTextContent: stripHtml(input.htmlContent), recipientCount: allowed.length, status: input.sendNow ? "QUEUED" : "DRAFT",
      recipients: { create: allowed.map((email) => { const c = contactMap.get(email); const merge = c ?? { email }; return { recipientEmail: email, contactId: c?.id, personalizedSubject: mergeFields(input.subject, merge), status: input.sendNow ? "QUEUED" : "PENDING" }; }) },
      attachments: { create: ownedFiles.map((f) => ({ fileAssetId: f.id })) },
    }, include: { recipients: true } });
    if (input.sendNow) {
      if (process.env.VERCEL && (process.env.QUEUE_PROVIDER ?? "database") === "database") {
        for (const recipient of campaign.recipients) {
          try {
            await sendCampaignRecipient({ campaignId: campaign.id, campaignRecipientId: recipient.id, idempotencyKey: `${campaign.id}:${recipient.id}` });
          } catch (error) {
            await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Unable to send email" } });
          }
        }
        await refreshCampaign(campaign.id);
      } else {
        await enqueueCampaign(campaign.id, campaign.recipients.map((recipient) => recipient.id));
      }
    }
    return Response.json({ campaign, excluded: emails.length - allowed.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message }, { status: 422 });
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create campaign" }, { status: 400 });
  }
}
