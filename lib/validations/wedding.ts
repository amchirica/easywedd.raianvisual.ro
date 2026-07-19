import { z } from "zod";

export const weddingStatusSchema = z.enum([
  "planning",
  "confirmed",
  "completed",
  "cancelled",
]);

export const weddingDetailsSchema = z.object({
  couple_name_1: z
    .string()
    .trim()
    .min(1, "Numele primului partener este obligatoriu")
    .max(80),
  couple_name_2: z
    .string()
    .trim()
    .min(1, "Numele celui de-al doilea partener este obligatoriu")
    .max(80),
  wedding_date: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  city: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  venue_name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  estimated_guest_count: z.coerce
    .number()
    .int("Numărul de invitați trebuie să fie întreg")
    .min(0)
    .max(10000)
    .optional()
    .nullable(),
  currency: z.enum(["RON", "EUR", "USD"]).default("RON"),
  wedding_status: weddingStatusSchema.default("planning"),
});

export type WeddingDetailsInput = z.infer<typeof weddingDetailsSchema>;

export const WEDDING_STATUS_LABELS: Record<
  z.infer<typeof weddingStatusSchema>,
  string
> = {
  planning: "În planificare",
  confirmed: "Confirmată",
  completed: "Finalizată",
  cancelled: "Anulată",
};
