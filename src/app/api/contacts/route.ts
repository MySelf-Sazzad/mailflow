import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/validations/contacts";
import type { Prisma, ContactStatus } from "@prisma/client";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const where: Prisma.ContactWhereInput = {
    userId: session.user.id,
    deletedAt: null,
    ...(status ? { status: status as ContactStatus } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({
    contacts,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.contact.findUnique({
    where: { userId_email: { userId: session.user.id, email } },
  });
  if (existing) {
    return NextResponse.json({ error: "A contact with this email already exists." }, { status: 409 });
  }

  const contactLimitCheck = await checkContactLimit(session.user.id);
  if (!contactLimitCheck.allowed) {
    return NextResponse.json({ error: contactLimitCheck.reason }, { status: 422 });
  }

  const contact = await prisma.contact.create({
    data: { ...parsed.data, email, userId: session.user.id },
  });

  return NextResponse.json({ contact }, { status: 201 });
}

async function checkContactLimit(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!subscription) return { allowed: false, reason: "No active subscription found." };

  const count = await prisma.contact.count({ where: { userId, deletedAt: null } });
  if (count >= subscription.plan.contactLimit) {
    return {
      allowed: false,
      reason: `Your plan allows up to ${subscription.plan.contactLimit} contacts. Upgrade to add more.`,
    };
  }
  return { allowed: true };
}
