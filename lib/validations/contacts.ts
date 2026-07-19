import { z } from "zod";

export const contactSchema = z.object({
  contact_type: z.enum([
    "parents",
    "godparents",
    "bridesmaids",
    "groomsmen",
    "restaurant",
    "dj",
    "photo_video",
    "transport",
    "accommodation",
    "emergency",
    "other",
  ]),
  name: z.string().min(1),
  role_label: z.string().optional(),
  phone: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  notes: z.string().optional(),
});
