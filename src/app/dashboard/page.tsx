import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [subscription, campaignCount, recentCampaigns, aggregates] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, include: { plan: true } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.campaign.aggregate({
      where: { userId },
      _sum: { sentCount: true, deliveredCount: true, failureCount: true },
    }),
  ]);

  const stats = [
    { label: "Total campaigns", value: campaignCount },
    { label: "Emails sent", value: aggregates._sum.sentCount ?? 0 },
    { label: "Delivered", value: aggregates._sum.deliveredCount ?? 0 },
    { label: "Failed", value: aggregates._sum.failureCount ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Overview</h1>
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New campaign
        </Link>
      </div>

      {subscription && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Current plan</p>
              <p className="font-display text-lg font-semibold text-slate-900">{subscription.plan.name}</p>
            </div>
            <div className="text-sm text-slate-600">
              {subscription.emailsSentToday} / {subscription.plan.emailsPerDay} sent today ·{" "}
              {subscription.emailsSentThisMonth} / {subscription.plan.emailsPerMonth} this month
            </div>
            <Link href="/dashboard/subscription" className="text-sm font-semibold text-brand-indigo">
              Manage plan
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent campaigns</h2>
        </div>
        {recentCampaigns.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No campaigns yet.{" "}
            <Link href="/dashboard/campaigns/new" className="font-semibold text-brand-indigo">
              Create your first one
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentCampaigns.map((c: { id: string; name: string; subject: string; status: string }) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-slate-500">{c.subject}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
