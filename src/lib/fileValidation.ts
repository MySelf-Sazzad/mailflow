// Single source of truth for allowed attachment types/sizes so the rule
// can't drift between the campaign composer, contact import, and template
// image uploads. Admin-configurable limits (max file size, allowed
// extensions) should read/write these via SiteSetting in a future pass —
// for now they're the safe defaults the spec calls for.

export const ALLOWED_ATTACHMENT_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
};

export const MAX_ATTACHMENT_SIZE_MB = 20;
export const MAX_CONTACT_IMPORT_SIZE_MB = 15;

export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateAttachment(file: { type: string; size: number; name: string }): FileValidationResult {
  if (!(file.type in ALLOWED_ATTACHMENT_TYPES)) {
    return { valid: false, reason: `File type "${file.type || "unknown"}" is not allowed.` };
  }

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_ATTACHMENT_SIZE_MB) {
    return { valid: false, reason: `File exceeds the ${MAX_ATTACHMENT_SIZE_MB} MB limit.` };
  }

  return { valid: true };
}

// Basic magic-byte sniff for the common types, so a renamed .exe with a
// .pdf extension doesn't sail through on Content-Type alone. Not a
// substitute for real virus scanning — see README "Security follow-ups".
export function sniffMimeMismatch(buffer: Buffer, declaredType: string): boolean {
  const signatures: [Buffer, string][] = [
    [Buffer.from([0x25, 0x44, 0x46]), "application/pdf"], // %PDF
    [Buffer.from([0x50, 0x4b, 0x03, 0x04]), "zip-family"], // PK.. (zip, docx, xlsx, pptx are all zip containers)
    [Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg"],
    [Buffer.from([0x89, 0x50, 0x4e, 0x47]), "image/png"],
  ];

  for (const [magic, family] of signatures) {
    if (buffer.subarray(0, magic.length).equals(magic)) {
      if (family === "zip-family") {
        return !declaredType.includes("zip") && !declaredType.includes("officedocument");
      }
      return declaredType !== family;
    }
  }

  return false;
}
