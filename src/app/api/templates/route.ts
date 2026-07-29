import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1).max(160),
  category: z.string().min(1).max(80),
  htmlContent: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = new URL(req.url).searchParams.get("category");

  const templates = await prisma.emailTemplate.findMany({
    where: {
      OR: [{ userId: session.user.id }, { isSystem: true }],
      ...(category ? { category } : {}),
    },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });
  if (subscription) {
    const count = await prisma.emailTemplate.count({ where: { userId: session.user.id } });
    if (count >= subscription.plan.templateLimit) {
      return NextResponse.json(
        { error: `Your plan allows up to ${subscription.plan.templateLimit} saved templates.` },
        { status: 422 }
      );
    }
  }

  const template = await prisma.emailTemplate.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json({ template }, { status: 201 });
}
