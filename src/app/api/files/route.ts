import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkStorageAllowed } from "@/lib/limits";
import { validateAttachment, sniffMimeMismatch } from "@/lib/fileValidation";
import { getStorageProvider } from "@/services/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const typeCheck = validateAttachment({ type: file.type, size: file.size, name: file.name });
  if (!typeCheck.valid) {
    return NextResponse.json({ error: typeCheck.reason }, { status: 422 });
  }

  const storageCheck = await checkStorageAllowed(session.user.id, file.size);
  if (!storageCheck.allowed) {
    return NextResponse.json({ error: storageCheck.reason }, { status: 422 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (sniffMimeMismatch(buffer, file.type)) {
    return NextResponse.json(
      { error: "File contents do not match the declared file type." },
      { status: 422 }
    );
  }

  const key = `users/${session.user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const storage = getStorageProvider();

  let uploadResult;
  try {
    uploadResult = await storage.upload({ key, buffer, contentType: file.type });
  } catch {
    return NextResponse.json(
      { error: "Upload failed. Check storage provider credentials in admin settings." },
      { status: 502 }
    );
  }

  const asset = await prisma.fileAsset.create({
    data: {
      userId: session.user.id,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey: uploadResult.key,
      storageUrl: uploadResult.url,
    },
  });

  return NextResponse.json({ file: asset }, { status: 201 });
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}
