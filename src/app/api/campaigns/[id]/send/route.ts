import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { checkCampaignSendAllowed } from "@/lib/limits";
import { enqueueCampaign } from "@/services/queue/campaignQueue";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id }, include: { recipients: { where: { status: "PENDING" } } } });
    if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });
    if (!body.permissionConfirmed) return Response.json({ error: "Confirm you have permission to contact these recipients." }, { status: 422 });
    const check = await checkCampaignSendAllowed(user.id, campaign.recipients.length);
    if (!check.allowed) return Response.json({ error: check.reason }, { status: 422 });
    await prisma.$transaction([
      prisma.campaign.update({ where: { id }, data: { status: body.scheduledAt ? "SCHEDULED" : "QUEUED", scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null } }),
      prisma.campaignRecipient.updateMany({ where: { campaignId: id, status: "PENDING" }, data: { status: "QUEUED" } }),
    ]);
    if (!body.scheduledAt) await enqueueCampaign(id, campaign.recipients.map((r) => r.id));
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to send" }, { status: 400 }); }
}
