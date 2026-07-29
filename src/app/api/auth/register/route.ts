import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/validations/auth";
import { sendVerificationEmail } from "@/services/email/transactional";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

export async function POST(req: NextRequest) {
  const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "true";
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { fullName, email, password, companyName, country } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Deliberately vague to avoid leaking which emails are registered.
    return NextResponse.json(
      { error: "Unable to create account with these details" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (!freePlan) {
    return NextResponse.json(
      { error: "Signup is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email: normalizedEmail,
      passwordHash,
      companyName,
      country,
      status: requireEmailVerification ? "PENDING_VERIFICATION" : "ACTIVE",
      emailVerified: requireEmailVerification ? null : new Date(),
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  let token: string | null = null;
  if (requireEmailVerification) {
    token = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000),
      },
    });
    await sendVerificationEmail(user.email, user.fullName, token);
  }

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "USER_REGISTERED" },
  });

  return NextResponse.json({
    success: true,
    autoVerified: !requireEmailVerification,
    // Local mode cannot deliver to a real inbox. Returning the link only in
    // development keeps onboarding usable without weakening production.
    verificationUrl: token && (process.env.EMAIL_PROVIDER ?? "local") === "local"
      ? `${process.env.APP_URL ?? "http://localhost:3000"}/verify-email?token=${token}`
      : undefined,
  }, { status: 201 });
}
