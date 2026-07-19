import { z } from "zod";

import { contentConfigSchema, themeConfigSchema } from "@/lib/invitations/schema";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  template_id: z.string().uuid(),
});

export const saveProjectSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  theme_config: themeConfigSchema.optional(),
  content_config: contentConfigSchema.optional(),
  rsvp_deadline: z.string().optional().nullable(),
});

export const invitationRsvpSchema = z.object({
  token: z.string().min(20),
  rsvp_status: z.enum(["confirmed", "declined", "maybe"]),
  attendance_count: z.coerce.number().int().nonnegative().default(1),
  children_count: z.coerce.number().int().nonnegative().default(0),
  meal_preference: z.string().max(200).optional(),
  allergies: z.string().max(300).optional(),
  transport_needed: z.boolean().default(false),
  accommodation_needed: z.boolean().default(false),
  message: z.string().max(500).optional(),
});

export const adminTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  category: z.enum([
    "editorial",
    "elegant",
    "minimalist",
    "romantic",
    "botanical",
    "luxury",
    "modern",
    "traditional_romanian",
    "destination_wedding",
  ]),
  thumbnail_url: z.string().max(500).optional().or(z.literal("")),
  is_premium: z.boolean().default(false),
  is_active: z.boolean().default(true),
  template_schema_json: z.string().min(2),
});
