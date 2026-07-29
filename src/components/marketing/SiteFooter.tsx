import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/templates", label: "Templates" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms and Conditions" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/acceptable-use", label: "Acceptable Use Policy" },
      { href: "/legal/anti-spam", label: "Anti-Spam Policy" },
      { href: "/legal/refund", label: "Refund Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" aria-label="MailFlow home"><BrandLogo className="h-14 w-auto rounded-xl" /></Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Send smarter. Reach more. Grow faster. One click, one email per recipient.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-slate-900">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-500 transition hover:text-brand-indigo">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} MailFlow. All rights reserved.</p>
          <p>
            Developed by{" "}
            <a href="https://codestacksolutions.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 underline-offset-4 transition hover:text-brand-indigo hover:underline">
              CodeStack Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
