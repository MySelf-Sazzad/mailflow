# MailFlow

MailFlow is a working bulk-email campaign SaaS built with Next.js 16, PostgreSQL, Prisma 7, Auth.js, and provider-based sending. Recipients are always processed separately and suppression is checked again immediately before sending.

## Zero-cost local mode

No paid service is needed for development. Email writes to `.data/mailbox`, uploads go to `.data/uploads`, billing uses admin-assigned plans, and queue jobs live in PostgreSQL. Redis, Resend, and S3 remain optional production adapters.

## Start locally

Install Node.js 20.19+ and Docker Desktop (or PostgreSQL). Copy `.env.example` to `.env`, then set `DATABASE_URL`, `AUTH_SECRET`, and `APP_URL`.

```powershell
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Run the web app and worker in separate terminals:

```powershell
npm run dev
npm run worker
```

Open `http://localhost:3000`. Local emails appear as JSON in `.data/mailbox`. The seed admin defaults to `admin@example.com` / `ChangeMe123!`; set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding and never retain the default outside local development.

## Providers

- `EMAIL_PROVIDER=local` is free and safe for development. Set `resend` plus `RESEND_API_KEY` for real delivery.
- `STORAGE_PROVIDER=local` stores private assets on disk. Set `s3` and AWS variables for multi-instance deployment.
- The database queue is default. Set `QUEUE_PROVIDER=redis` and `REDIS_URL` for BullMQ distributed workers.
- Paid-plan activation is intentionally manual: an admin selects a plan on `/admin/users`. Card data is never stored.

## Implemented areas

- Authentication, verification gate, lockout, protected dashboard, and role-gated admin using Next.js 16 `proxy.ts` plus route-level checks.
- Contact CRUD/list/import, templates, validated uploads, and database-backed configurable limits.
- Multi-step campaign builder, merge fields, preview, separate durable recipient jobs, schedules, retries/dead letters, local/Resend delivery.
- Campaign history/details, aggregate analytics, signed unsubscribe, suppression, idempotent provider events, bounce/complaint suppression.
- Subscription usage/plans/manual upgrades, support tickets, notifications, and admin users/campaigns/plans/queue/support/audit views.
- Responsive layout, focus states, reduced motion, offline fonts, lint, TypeScript, unit tests, Docker PostgreSQL, and environment docs.

## Production

Deploy web and worker separately. Use managed PostgreSQL, `QUEUE_PROVIDER=redis`, a verified sender domain, S3 storage, and HTTPS. Point provider events to `/api/webhooks/email` and set `EMAIL_WEBHOOK_SECRET`. Rotate secrets, back up PostgreSQL, and add ClamAV or another scanner before public uploads; magic-byte validation is not antivirus.

Useful commands: `npm test`, `npm run lint`, `npm run build`, `npm run worker`, `npm run prisma:migrate`, `npm run prisma:seed`.
