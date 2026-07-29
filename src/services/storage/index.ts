import { S3StorageProvider } from "./providers/s3";
import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./providers/local";
import { DatabaseStorageProvider } from "./providers/database";

// Same swap pattern as the email provider factory. Add cloudinary/supabase/
// firebase implementations here as they're built.
export function getStorageProvider(): StorageProvider {
  const configured = process.env.STORAGE_PROVIDER ?? "local";
  const provider = process.env.VERCEL && configured === "local" ? "database" : configured;

  switch (provider) {
    case "local":
      return new LocalStorageProvider();
    case "database":
      return new DatabaseStorageProvider();
    case "s3":
    default:
      return new S3StorageProvider(
        process.env.AWS_REGION ?? "us-east-1",
        process.env.AWS_S3_BUCKET ?? ""
      );
  }
}

export type { StorageProvider, UploadInput, UploadResult } from "./provider";
