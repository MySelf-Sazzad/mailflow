import { z } from "zod";

export const contactSchema = z.object({
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(40).optional(),
  company: z.string().max(160).optional(),
  position: z.string().max(160).optional(),
  country: z.string().max(80).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  notes: z.string().max(2000).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const contactListSchema = z.object({
  name: z.string().min(1, "List name is required").max(120),
});
