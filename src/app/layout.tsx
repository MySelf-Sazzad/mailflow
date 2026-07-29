import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailFlow — Send personalised emails to every recipient, one click.",
  description:
    "Create campaigns, manage contacts, attach files, schedule delivery, and track performance from one powerful email platform. Every recipient gets their own email.",
  icons: {
    icon: [{ url: "/brand/mailflow-favicon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/brand/mailflow-favicon.svg",
    apple: "/brand/mailflow-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
