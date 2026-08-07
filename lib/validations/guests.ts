import { z } from "zod";

export const guestSchema = z.object({
  first_name: z.string().min(1, "validation.firstNameRequired"),
  last_name: z.string().default(""),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().optional(),
  relationship: z.string().optional(),
  side: z.enum(["bride", "groom", "both", "other"]).default("other"),
  group_id: z.string().uuid().optional().or(z.literal("")),
  invitation_status: z
    .enum(["not_sent", "sent", "delivered", "opened"])
    .default("not_sent"),
  rsvp_status: z
    .enum(["pending", "confirmed", "declined", "maybe"])
    .default("pending"),
  attendance_count: z.coerce.number().int().nonnegative().default(1),
  children_count: z.coerce.number().int().nonnegative().default(0),
  meal_preference: z.string().optional(),
  allergies: z.string().optional(),
  accommodation_needed: z.boolean().default(false),
  transport_needed: z.boolean().default(false),
  notes: z.string().optional(),
  consent_to_contact: z.boolean().default(false),
});

export const guestGroupSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
});

export const rsvpPublicSchema = z.object({
  token: z.string().min(10),
  rsvp_status: z.enum(["confirmed", "declined", "maybe"]),
  attendance_count: z.coerce.number().int().nonnegative().default(1),
  children_count: z.coerce.number().int().nonnegative().default(0),
  meal_preference: z.string().optional(),
  allergies: z.string().optional(),
  message: z.string().optional(),
});
