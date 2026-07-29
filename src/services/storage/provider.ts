// Storage abstraction — mirrors src/services/email/provider.ts. Swap S3 for
// Cloudinary/Supabase/Firebase by implementing this interface and updating
// getStorageProvider(); nothing else in the app should import a provider SDK directly.

export interface UploadInput {
  key: string;
  buffer: Buffer;
  contentType: string;
}

export interface UploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  name: string;
  upload(input: UploadInput): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
