import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const asset = await prisma.fileAsset.findFirst({ where: { storageKey: key, userId: session.user.id } });
  if (!asset || key.includes("..")) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    const data = await readFile(path.join(process.cwd(), ".data", "uploads", ...key.split("/")));
    return new Response(data, { headers: { "Content-Type": asset.mimeType, "Content-Disposition": `attachment; filename="${asset.fileName.replaceAll('"', '')}"` } });
  } catch { return Response.json({ error: "Not found" }, { status: 404 }); }
}
