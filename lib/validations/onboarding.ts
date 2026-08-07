import { z } from "zod";

export const workspaceTypeSchema = z.enum([
  "couple",
  "raian_client",
  "professional",
  "agency",
]);

export const onboardingSchema = z.object({
  workspace_type: workspaceTypeSchema,
  workspace_name: z.string().min(2, "validation.workspaceNameMin"),
  couple_name_1: z.string().min(1, "validation.partner1Required"),
  couple_name_2: z.string().min(1, "validation.partner2Required"),
  wedding_date: z.string().optional(),
  city: z.string().optional(),
  venue_name: z.string().optional(),
  estimated_guest_count: z.number().int().positive().optional(),
  partner_email: z
    .union([z.email("validation.invalidEmail"), z.literal("")])
    .optional(),
  anonymized_industry_research: z.boolean().default(false),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
