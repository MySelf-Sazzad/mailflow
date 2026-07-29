import Papa from "papaparse";
import ExcelJS from "exceljs";

export interface RawImportRow {
  [column: string]: string;
}

export interface ParsedContactRow {
  rowNumber: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  valid: boolean;
  invalidReason?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Recognises common header spellings so users don't have to rename
// columns before uploading (case-insensitive, ignores spaces/underscores).
const COLUMN_ALIASES: Record<string, string[]> = {
  email: ["email", "emailaddress", "e-mail"],
  firstName: ["firstname", "first"],
  lastName: ["lastname", "last", "surname"],
  phone: ["phone", "phonenumber", "mobile"],
  company: ["company", "companyname", "organization", "organisation"],
};

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[\s_-]/g, "");
}

function mapRow(row: RawImportRow): Partial<ParsedContactRow> {
  const normalizedEntries = Object.entries(row).map(([k, v]) => [normalizeHeader(k), v] as const);
  const lookup = Object.fromEntries(normalizedEntries);

  const result: Partial<ParsedContactRow> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      if (lookup[alias] !== undefined && lookup[alias] !== "") {
        (result as Record<string, string>)[field] = String(lookup[alias]).trim();
        break;
      }
    }
  }
  return result;
}

export function parseCsvBuffer(buffer: Buffer): RawImportRow[] {
  const text = buffer.toString("utf-8");
  const { data } = Papa.parse<RawImportRow>(text, { header: true, skipEmptyLines: true });
  return data;
}

export async function parseXlsxBuffer(buffer: Buffer): Promise<RawImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map((value) => String(value ?? ""));
  const rows: RawImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = (row.values as unknown[]).slice(1);
    const item = Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? "")]));
    if (Object.values(item).some(Boolean)) rows.push(item);
  });
  return rows;
}

/**
 * Validates and de-duplicates rows from a parsed import file. Existing
 * emails (already in the user's contact book) are flagged as duplicates
 * rather than silently skipped, so the import summary can report them.
 */
export function validateAndDedupeRows(
  rows: RawImportRow[],
  existingEmails: Set<string>
): { valid: ParsedContactRow[]; invalid: ParsedContactRow[]; duplicates: ParsedContactRow[] } {
  const seenInFile = new Set<string>();
  const valid: ParsedContactRow[] = [];
  const invalid: ParsedContactRow[] = [];
  const duplicates: ParsedContactRow[] = [];

  rows.forEach((raw, index) => {
    const mapped = mapRow(raw);
    const email = (mapped.email ?? "").toLowerCase().trim();
    const rowNumber = index + 2; // +1 for header row, +1 for 1-indexing

    if (!email || !EMAIL_REGEX.test(email)) {
      invalid.push({
        rowNumber,
        email: mapped.email ?? "",
        valid: false,
        invalidReason: !email ? "Missing email address" : "Invalid email format",
      });
      return;
    }

    if (seenInFile.has(email) || existingEmails.has(email)) {
      duplicates.push({ rowNumber, email, valid: false, invalidReason: "Duplicate" });
      return;
    }

    seenInFile.add(email);
    valid.push({
      rowNumber,
      email,
      firstName: mapped.firstName,
      lastName: mapped.lastName,
      phone: mapped.phone,
      company: mapped.company,
      valid: true,
    });
  });

  return { valid, invalid, duplicates };
}
