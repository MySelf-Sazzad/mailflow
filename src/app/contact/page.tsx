import { MarketingPage } from "@/components/marketing/MarketingPage";

export default function ContactPage() {
  return (
    <MarketingPage eyebrow="Contact" title="Talk to CodeStack Solutions" intro="Questions about MailFlow, deployment, or responsible email sending? We are ready to help.">
      <section className="card mx-auto max-w-2xl p-8 text-center">
        <h2 className="section-title">Contact the development team</h2>
        <p className="mt-3 text-slate-600">Visit CodeStack Solutions to find the latest company contact options and project information.</p>
        <a href="https://codestacksolutions.vercel.app/" target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 inline-flex">Visit CodeStack Solutions</a>
      </section>
    </MarketingPage>
  );
}
