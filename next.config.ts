import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the live dev route manifest separate from production builds. This
  // prevents `next build` from making an open `next dev` session return 404s.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // Prisma 7's driver adapter loads the native PostgreSQL driver at runtime.
  // Keeping both external prevents Turbopack from generating fragile cached
  // module paths under .next/dev on Windows.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
