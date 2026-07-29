import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "../provider";

export class LocalEmailProvider implements EmailProvider {
  name = "local";
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const id = `local_${crypto.randomUUID()}`;
    const directory = path.join(process.cwd(), ".data", "mailbox");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${id}.json`), JSON.stringify({ id, createdAt: new Date().toISOString(), ...input }, null, 2));
    return { providerMessageId: id, accepted: true };
  }
  verifyWebhookSignature() { return false; }
}
