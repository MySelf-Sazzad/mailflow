import { escapeHtml } from "@/lib/security";

export type MergeContact = { firstName?: string | null; lastName?: string | null; email: string; company?: string | null; phone?: string | null };

export function mergeFields(content: string, contact: MergeContact) {
  const values: Record<string, string> = {
    first_name: contact.firstName ?? "",
    last_name: contact.lastName ?? "",
    full_name: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
    email: contact.email,
    company: contact.company ?? "",
    phone: contact.phone ?? "",
  };
  return content.replace(/{{\s*([a-z_]+)\s*}}/gi, (_, key: string) => escapeHtml(values[key.toLowerCase()] ?? ""));
}

export function stripHtml(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
