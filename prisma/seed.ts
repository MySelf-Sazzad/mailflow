import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const plans = [
    {
      slug: "free", name: "Free", description: "Try MailFlow with light sending needs.",
      monthlyPriceCents: 0, annualPriceCents: 0,
      recipientsPerCampaign: 3, emailsPerDay: 20, emailsPerMonth: 100,
      contactLimit: 200, storageLimitMb: 100, attachmentLimitMb: 5, templateLimit: 5,
      teamMemberLimit: 1, apiAccess: false, brandingRemoval: false, customDomainAccess: false,
      sortOrder: 0,
    },
    {
      slug: "starter", name: "Starter", description: "For freelancers sending regular campaigns.",
      monthlyPriceCents: 1900, annualPriceCents: 19000,
      recipientsPerCampaign: 10, emailsPerDay: 300, emailsPerMonth: 3000,
      contactLimit: 2000, storageLimitMb: 1000, attachmentLimitMb: 10, templateLimit: 20,
      teamMemberLimit: 1, apiAccess: false, brandingRemoval: true, customDomainAccess: false,
      sortOrder: 1,
    },
    {
      slug: "professional", name: "Professional", description: "For growing teams that need analytics.",
      monthlyPriceCents: 4900, annualPriceCents: 49000,
      recipientsPerCampaign: 20, emailsPerDay: 1000, emailsPerMonth: 20000,
      contactLimit: 10000, storageLimitMb: 5000, attachmentLimitMb: 20, templateLimit: 100,
      teamMemberLimit: 3, apiAccess: false, brandingRemoval: true, customDomainAccess: false,
      isFeatured: true, sortOrder: 2,
    },
    {
      slug: "business", name: "Business", description: "For agencies with API and team needs.",
      monthlyPriceCents: 9900, annualPriceCents: 99000,
      recipientsPerCampaign: 50, emailsPerDay: 5000, emailsPerMonth: 100000,
      contactLimit: 100000, storageLimitMb: 20000, attachmentLimitMb: 25, templateLimit: 500,
      teamMemberLimit: 10, apiAccess: true, brandingRemoval: true, customDomainAccess: true,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        fullName: "Super Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });
    console.log(`Seeded super admin: ${adminEmail} (change SEED_ADMIN_PASSWORD before real use)`);
  }

  const systemTemplates = [
    {
      name: "Simple Welcome Email",
      category: "Welcome",
      htmlContent: `<div style="font-family:sans-serif;padding:24px"><h2>Welcome, {{first_name}}!</h2><p>We're glad you're here. Here's how to get started with {{company}}...</p></div>`,
    },
    {
      name: "Client Follow-up",
      category: "Follow-up",
      htmlContent: `<div style="font-family:sans-serif;padding:24px"><p>Hi {{first_name}},</p><p>Just following up on our last conversation — let me know if you have any questions.</p></div>`,
    },
    {
      name: "Monthly Newsletter",
      category: "Newsletter",
      htmlContent: `<div style="font-family:sans-serif;padding:24px"><h2>This Month at {{company}}</h2><p>Here's what's new...</p></div>`,
    },
  ];

  for (const tpl of systemTemplates) {
    const exists = await prisma.emailTemplate.findFirst({ where: { name: tpl.name, isSystem: true } });
    if (!exists) {
      await prisma.emailTemplate.create({ data: { ...tpl, isSystem: true } });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
