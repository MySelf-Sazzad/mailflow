import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsvBuffer, parseXlsxBuffer, validateAndDedupeRows } from "@/lib/contactImport";
import { MAX_CONTACT_IMPORT_SIZE_MB } from "@/lib/fileValidation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const commit = formData.get("commit") === "true";
  const listId = formData.get("listId")?.toString();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_CONTACT_IMPORT_SIZE_MB) {
    return NextResponse.json(
      { error: `Import file exceeds the ${MAX_CONTACT_IMPORT_SIZE_MB} MB limit.` },
      { status: 422 }
    );
  }

  const isXlsx =
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.type.includes("spreadsheetml");

  const buffer = Buffer.from(await file.arrayBuffer());

  let rows;
  try {
    rows = isXlsx ? await parseXlsxBuffer(buffer) : parseCsvBuffer(buffer);
  } catch {
    return NextResponse.json({ error: "Could not read this file. Check the format and try again." }, { status: 422 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in the uploaded file." }, { status: 422 });
  }

  const existingContacts = await prisma.contact.findMany({
    where: { userId: session.user.id, deletedAt: null },
    select: { email: true },
  });
  const existingEmails: Set<string> = new Set(existingContacts.map((c: { email: string }) => c.email));

  const { valid, invalid, duplicates } = validateAndDedupeRows(rows, existingEmails);

  const summary = {
    totalRows: rows.length,
    validCount: valid.length,
    invalidCount: invalid.length,
    duplicateCount: duplicates.length,
    failedRows: [...invalid, ...duplicates],
  };

  if (!commit) {
    // Preview mode: show the summary without writing anything, so the
    // user can confirm before contacts actually get created.
    return NextResponse.json({ preview: true, summary, sample: valid.slice(0, 10) });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 422 });
  }

  const currentCount = existingContacts.length;
  const room = subscription.plan.contactLimit - currentCount;
  const toImport = valid.slice(0, Math.max(0, room));

  const created = await prisma.$transaction(
    toImport.map((row) =>
      prisma.contact.create({
        data: {
          userId: session.user.id,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          company: row.company,
        },
      })
    )
  );

  if (listId) {
    await prisma.contactListMember.createMany({
      data: created.map((c: { id: string }) => ({ contactListId: listId, contactId: c.id })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    preview: false,
    summary: {
      ...summary,
      importedCount: created.length,
      skippedForPlanLimit: valid.length - created.length,
    },
  });
}
