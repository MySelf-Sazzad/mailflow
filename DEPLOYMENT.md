# MailFlow deployment checklist

## Required services

- GitHub repository for the source code.
- Vercel project for the Next.js application.
- Hosted PostgreSQL database (Neon works with Vercel).
- Resend API key. Without a verified custom domain, Resend only delivers test mail to the account owner's address.
- S3-compatible storage only if attachments are enabled. Set `STORAGE_PROVIDER=local` when testing without attachments.

## Production environment variables

Add these in Vercel Project Settings > Environment Variables:

```text
DATABASE_URL=<hosted PostgreSQL connection string>
AUTH_SECRET=<new random secret>
NEXTAUTH_URL=https://YOUR-PROJECT.vercel.app
APP_URL=https://YOUR-PROJECT.vercel.app
APP_NAME=MailFlow
QUEUE_PROVIDER=database
EMAIL_PROVIDER=resend
RESEND_API_KEY=<new Resend key>
DEFAULT_SENDER_EMAIL=onboarding@resend.dev
DEFAULT_SENDER_NAME=MailFlow
STORAGE_PROVIDER=local
SEED_ADMIN_EMAIL=<your admin email>
SEED_ADMIN_PASSWORD=<strong temporary admin password>
```

Do not copy `.env` into GitHub. Rotate any API key that has previously been shared or exposed.

For attachments, replace local storage with:

```text
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
```

## Initialize the hosted database

Temporarily set `DATABASE_URL` to the hosted connection string in a local terminal, then run:

```powershell
npm run prisma:deploy
npm run prisma:seed
```

Do this once before using the production site. Change the seeded admin password from the admin settings page after the first login.

## Verify after deployment

1. Open `/`, `/register`, `/login`, and `/admin/login`.
2. Register a test user and verify the account.
3. Send one test email to the address connected to the Resend account.
4. Confirm the campaign changes from sending to completed.
5. Do not test other recipient addresses until a custom sending domain is verified in Resend.
