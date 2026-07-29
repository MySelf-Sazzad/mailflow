import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navItems = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/templates", label: "Templates" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="MailFlow home">
          <BrandLogo className="h-12 w-auto rounded-lg" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-brand-indigo">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-brand-indigo sm:block"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-brand-indigo px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-300/50 transition hover:bg-indigo-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
