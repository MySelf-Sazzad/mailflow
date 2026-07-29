import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SplitVisual } from "@/components/marketing/SplitVisual";

const workflow = [
  { step: "01", title: "Compose once", body: "Write the subject, message, and attachments a single time in the campaign builder." },
  { step: "02", title: "Add recipients", body: "Paste addresses, pick a contact list, or import a CSV — invalid and duplicate rows are filtered automatically." },
  { step: "03", title: "We split it", body: "Every recipient gets their own email, sent separately through the queue, so no one sees anyone else's address." },
  { step: "04", title: "Track results", body: "Opens, clicks, bounces, and unsubscribes roll up per campaign and per recipient in real time." },
];

const features = [
  { title: "Bulk sending, one at a time", body: "Each recipient receives an individually addressed email — never a shared To/CC field." },
  { title: "Contacts & lists", body: "Import CSV or XLSX, organise into lists, and let MailFlow catch duplicates and bad addresses." },
  { title: "Personalisation", body: "Drop in {{first_name}}, {{company}}, or any custom field — every send is unique to its recipient." },
  { title: "Attachments & video links", body: "Attach PDFs, docs, and images directly, or link out to hosted video instead of bloating the message." },
  { title: "Scheduling", body: "Send now or queue a campaign for a specific date, time, and time zone." },
  { title: "Deliverability tools", body: "Bounce handling, complaint monitoring, and suppression lists keep your sender reputation healthy." },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo/10 px-3 py-1 text-xs font-semibold text-brand-indigo">
              Every recipient gets their own email
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Send personalised emails to every client, with one click.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Create campaigns, manage contacts, attach files, schedule delivery, and track
              performance from one platform — while each recipient only ever sees their own address.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-full bg-brand-indigo px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-300/50 transition hover:bg-indigo-700"
              >
                Start free
              </Link>
              <Link
                href="/features"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo"
              >
                View demo
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              No credit card required · Free plan includes 100 emails / month
            </p>
          </div>
          <SplitVisual />
        </section>

        {/* Workflow — a real ordered sequence, so numbering earns its place */}
        <section className="border-y border-slate-200/70 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
              How a campaign moves through MailFlow
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item) => (
                <div key={item.step}>
                  <span className="font-display text-sm font-semibold text-brand-purple">{item.step}</span>
                  <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            Everything a campaign needs
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-indigo/40 hover:shadow-md">
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="bg-brand-dark py-20 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Built for responsible sending
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Every campaign requires a confirmed permission to contact its recipients. Unsubscribe
              links, suppression lists, and bounce handling are on by default — not optional add-ons.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                ["Encrypted at rest", "Passwords hashed, secrets encrypted, sessions in HTTP-only cookies."],
                ["Role-based access", "Team permissions and a fully separated admin console."],
                ["Suppression by default", "Bounces, complaints, and unsubscribes are excluded automatically."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            Ready to send your first campaign?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            Start on the free plan — no credit card, upgrade whenever you outgrow it.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-full bg-brand-indigo px-8 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-300/50 transition hover:bg-indigo-700"
          >
            Create your free account
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
