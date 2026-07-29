import type { StorageProvider, UploadInput, UploadResult } from "../provider";

export class DatabaseStorageProvider implements StorageProvider {
  name = "database";
  async upload(input: UploadInput): Promise<UploadResult> {
    return { key: `data:${input.buffer.toString("base64")}`, url: "/api/files/content" };
  }
  async delete() {}
  async getSignedDownloadUrl() { return "/api/files/content"; }
}
