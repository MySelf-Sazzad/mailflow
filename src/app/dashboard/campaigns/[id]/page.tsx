import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: session!.user.id },
    include: { recipients: { orderBy: { createdAt: "asc" }, take: 100 } },
  });
  if (!campaign) notFound();

  const rate = (count: number) => campaign.sentCount
    ? `${Math.round(count / campaign.sentCount * 100)}%`
    : "0%";

  return <div className="space-y-6">
    <div>
      <p className="text-sm text-brand-indigo">{campaign.status.replaceAll("_", " ")}</p>
      <h1 className="page-title">{campaign.name}</h1>
      <p className="page-subtitle">{campaign.subject}</p>
    </div>
    <div className="stats-grid">
      {[["Recipients", campaign.recipientCount], ["Sent", campaign.sentCount], ["Delivered", campaign.deliveredCount], ["Open rate", rate(campaign.openCount)], ["Click rate", rate(campaign.clickCount)], ["Failed", campaign.failureCount]].map(([label, value]) =>
        <div className="stat-card" key={label}><p>{label}</p><strong>{value}</strong></div>)}
    </div>
    <section className="card overflow-x-auto">
      <h2 className="section-title p-5">Recipients</h2>
      <table className="data-table">
        <thead><tr><th>Email</th><th>Status</th><th>Sent</th><th>Details</th></tr></thead>
        <tbody>{campaign.recipients.map((recipient) => <tr key={recipient.id}>
          <td>{recipient.recipientEmail}</td>
          <td>{recipient.status}</td>
          <td>{recipient.sentAt?.toLocaleString() ?? "—"}</td>
          <td className="max-w-md text-sm text-rose-600">{recipient.errorMessage ?? "—"}</td>
        </tr>)}</tbody>
      </table>
    </section>
    <section className="card p-6">
      <h2 className="section-title">Email preview</h2>
      <div className="mt-4 rounded-xl border p-6" dangerouslySetInnerHTML={{ __html: campaign.htmlContent }}/>
    </section>
  </div>;
}
