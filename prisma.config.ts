import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: {
    // Vercel's Neon integration provides a direct connection specifically for
    // migrations. Runtime queries continue using the pooled DATABASE_URL.
    url: process.env.DATABASE_POSTGRES_URL_NON_POOLING
      ?? process.env.DATABASE_URL
      ?? "postgresql://postgres:postgres@localhost:5432/mailflow",
  },
});
