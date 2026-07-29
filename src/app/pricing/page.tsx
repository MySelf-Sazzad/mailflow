import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { prisma } from "@/lib/prisma";

// Pricing is database-driven and must reflect admin plan changes immediately.
export const dynamic = "force-dynamic";

interface PlanCard {
  slug: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number;
  recipientsPerCampaign: number;
  emailsPerDay: number;
  emailsPerMonth: number;
  storageLimitMb: number;
  apiAccess: boolean;
  brandingRemoval: boolean;
  isFeatured: boolean;
}

export default async function PricingPage() {
  let plans: PlanCard[] = await prisma.plan
    .findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
    .catch(() => []);

  // Fallback so the page still renders (e.g. before `npx prisma db seed` has run).
  if (plans.length === 0) {
    plans = FALLBACK_PLANS as PlanCard[];
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900">
            Simple pricing that scales with your list
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Every plan sends one email per recipient. Upgrade any time as your recipient count or
            sending volume grows.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.slug}
              className={`flex flex-col rounded-2xl border p-6 ${
                plan.isFeatured
                  ? "border-brand-indigo bg-white shadow-lg shadow-indigo-100"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.isFeatured && (
                <span className="mb-3 w-fit rounded-full bg-brand-indigo/10 px-2.5 py-0.5 text-xs font-semibold text-brand-indigo">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-lg font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
              <p className="mt-5">
                <span className="font-display text-3xl font-semibold text-slate-900">
                  ${(plan.monthlyPriceCents / 100).toFixed(0)}
                </span>
                <span className="text-sm text-slate-500"> /month</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                <li>Up to {plan.recipientsPerCampaign} recipients / campaign</li>
                <li>{plan.emailsPerDay.toLocaleString()} emails / day</li>
                <li>{plan.emailsPerMonth.toLocaleString()} emails / month</li>
                <li>{plan.storageLimitMb.toLocaleString()} MB file storage</li>
                {plan.apiAccess && <li>API access</li>}
                {plan.brandingRemoval && <li>Remove MailFlow branding</li>}
              </ul>
              <Link
                href="/register"
                className={`mt-8 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                  plan.isFeatured
                    ? "bg-brand-indigo text-white hover:bg-indigo-700"
                    : "border border-slate-300 text-slate-700 hover:border-brand-indigo hover:text-brand-indigo"
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// Matches the seeded Plan rows in prisma/seed.ts — kept here only as a
// render-time fallback, never as the source of truth for limits.
const FALLBACK_PLANS = [
  { slug: "free", name: "Free", description: "Try MailFlow with light sending needs.", monthlyPriceCents: 0, recipientsPerCampaign: 3, emailsPerDay: 20, emailsPerMonth: 100, storageLimitMb: 100, apiAccess: false, brandingRemoval: false, isFeatured: false },
  { slug: "starter", name: "Starter", description: "For freelancers sending regular campaigns.", monthlyPriceCents: 1900, recipientsPerCampaign: 10, emailsPerDay: 300, emailsPerMonth: 3000, storageLimitMb: 1000, apiAccess: false, brandingRemoval: true, isFeatured: false },
  { slug: "professional", name: "Professional", description: "For growing teams that need analytics.", monthlyPriceCents: 4900, recipientsPerCampaign: 20, emailsPerDay: 1000, emailsPerMonth: 20000, storageLimitMb: 5000, apiAccess: false, brandingRemoval: true, isFeatured: true },
  { slug: "business", name: "Business", description: "For agencies with API and team needs.", monthlyPriceCents: 9900, recipientsPerCampaign: 50, emailsPerDay: 5000, emailsPerMonth: 100000, storageLimitMb: 20000, apiAccess: true, brandingRemoval: true, isFeatured: false },
];
