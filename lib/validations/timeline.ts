import { z } from "zod";

export const timelineItemSchema = z.object({
  title: z.string().min(1),
  location: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  responsible_person: z.string().optional(),
  contact_phone: z.string().optional(),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
  visibility: z
    .enum(["couple", "photo_team", "guests", "private"])
    .default("couple"),
  sort_order: z.coerce.number().int().default(0),
});
