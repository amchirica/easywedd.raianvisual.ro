import { z } from "zod";

export const workspaceTypeSchema = z.enum([
  "couple",
  "raian_client",
  "professional",
  "agency",
]);

export const onboardingSchema = z.object({
  workspace_type: workspaceTypeSchema,
  workspace_name: z.string().min(2, "Numele workspace-ului este obligatoriu"),
  couple_name_1: z
    .string()
    .min(1, "Prenumele primului partener este obligatoriu"),
  couple_name_2: z
    .string()
    .min(1, "Prenumele celui de-al doilea partener este obligatoriu"),
  wedding_date: z.string().optional(),
  city: z.string().optional(),
  venue_name: z.string().optional(),
  estimated_guest_count: z.number().int().positive().optional(),
  partner_email: z.union([z.email("Email invalid"), z.literal("")]).optional(),
  anonymized_industry_research: z.boolean().default(false),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
