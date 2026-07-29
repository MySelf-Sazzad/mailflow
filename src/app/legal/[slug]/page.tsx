import { notFound } from "next/navigation";
import { MarketingPage } from "@/components/marketing/MarketingPage";

const policies = {
  terms: { title: "Terms and Conditions", intro: "The basic terms for using MailFlow.", sections: ["Use MailFlow only for lawful, permission-based communication.", "You are responsible for your account, recipients, content, and compliance with applicable laws.", "Service availability and limits may change as the platform develops."] },
  privacy: { title: "Privacy Policy", intro: "How MailFlow handles account and campaign information.", sections: ["MailFlow stores the information needed to operate your account and campaigns.", "Passwords are hashed and provider credentials remain server-side.", "Contact support to request access, correction, or deletion of your account data."] },
  "acceptable-use": { title: "Acceptable Use Policy", intro: "Rules that protect recipients and the platform.", sections: ["Do not send unlawful, deceptive, abusive, or harmful content.", "Do not upload malware or attempt to bypass account and sending limits.", "Accounts may be suspended when use threatens recipients, providers, or the service."] },
  "anti-spam": { title: "Anti-Spam Policy", intro: "MailFlow is for consent-based email only.", sections: ["Send only to recipients who gave you permission to contact them.", "Do not use purchased, scraped, or improperly shared contact lists.", "Respect unsubscribe requests immediately and maintain accurate sender information."] },
  refund: { title: "Refund Policy", intro: "Billing terms for MailFlow subscriptions.", sections: ["The current project uses administrator-assigned plans and does not process automatic payments.", "If paid billing is introduced, its checkout terms and refund period must be displayed before purchase.", "Contact CodeStack Solutions with any billing question."] },
} as const;

export function generateStaticParams() { return Object.keys(policies).map((slug) => ({ slug })); }

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies[slug as keyof typeof policies];
  if (!policy) notFound();
  return <MarketingPage eyebrow="Legal" title={policy.title} intro={policy.intro}><section className="card mx-auto max-w-3xl p-8"><p className="text-sm text-slate-500">Last updated: July 29, 2026</p><div className="mt-6 space-y-4 text-slate-700">{policy.sections.map((section) => <p key={section}>{section}</p>)}</div></section></MarketingPage>;
}
