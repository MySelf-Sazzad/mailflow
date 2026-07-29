import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { BrandLogo } from "@/components/brand/BrandLogo";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/campaigns/new", label: "New Campaign" },
  { href: "/dashboard/campaigns", label: "Campaigns" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/contacts/import", label: "Import Contacts" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/subscription", label: "Subscription" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <Link href="/dashboard" className="flex h-16 items-center border-b border-slate-100 px-5" aria-label="MailFlow dashboard">
          <BrandLogo className="h-12 w-auto rounded-lg" />
        </Link>
        <nav className="space-y-1 px-3 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-brand-indigo"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <p className="text-sm text-slate-500">Signed in as {session?.user?.email}</p>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-brand-indigo">Home</Link>
            <SignOutButton />
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
