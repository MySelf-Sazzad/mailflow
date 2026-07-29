import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, UploadInput, UploadResult } from "../provider";

export class LocalStorageProvider implements StorageProvider {
  name = "local";
  async upload(input: UploadInput): Promise<UploadResult> {
    const target = path.join(process.cwd(), ".data", "uploads", ...input.key.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.buffer);
    return { key: input.key, url: `/api/files/content?key=${encodeURIComponent(input.key)}` };
  }
  async delete(key: string) {
    const target = path.join(process.cwd(), ".data", "uploads", ...key.split("/"));
    await unlink(target).catch(() => undefined);
  }
  async getSignedDownloadUrl(key: string) { return `/api/files/content?key=${encodeURIComponent(key)}`; }
}
