import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/validations/contacts";

async function getOwnedContact(userId: string, id: string) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact || contact.userId !== userId) return null;
  return contact;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contact = await getOwnedContact(session.user.id, id);
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ contact });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedContact(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);

  // Allow partial updates (e.g. status-only changes for archive/block actions)
  // alongside full-field edits from the contact form.
  if (body?.action === "archive" || body?.action === "block") {
    const contact = await prisma.contact.update({
      where: { id },
      data: { status: body.action === "block" ? "BLOCKED" : existing.status },
    });
    return NextResponse.json({ contact });
  }

  const parsed = contactSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email?.toLowerCase().trim(),
    },
  });

  return NextResponse.json({ contact });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedContact(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete — never hard-delete contact history, matches spec's
  // soft-deletion requirement (section 32).
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
