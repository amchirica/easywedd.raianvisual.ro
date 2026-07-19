import { z } from "zod";

export const tableSchema = z.object({
  label: z.string().min(1),
  shape: z.enum(["round", "rectangle"]).default("round"),
  capacity: z.coerce.number().int().positive().default(8),
  layout_id: z.string().uuid().optional().or(z.literal("")),
});

export const assignGuestSchema = z.object({
  guest_id: z.string().uuid(),
  table_id: z.string().uuid().nullable(),
});
