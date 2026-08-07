import { z } from "zod";

export const tableSchema = z.object({
  label: z.string().min(1, "validation.tableLabelRequired"),
  shape: z.enum(["round", "rectangle"]).default("round"),
  capacity: z.coerce.number().int().positive().max(100).default(8),
  layout_id: z.string().uuid().optional().or(z.literal("")),
  pos_x: z.coerce.number().min(0).max(4000).optional(),
  pos_y: z.coerce.number().min(0).max(4000).optional(),
});

export const updateTableSchema = z.object({
  table_id: z.string().uuid(),
  label: z.string().min(1).max(80).optional(),
  shape: z.enum(["round", "rectangle"]).optional(),
  capacity: z.coerce.number().int().positive().max(100).optional(),
  pos_x: z.coerce.number().min(0).max(4000).optional(),
  pos_y: z.coerce.number().min(0).max(4000).optional(),
});

export const assignGuestSchema = z.object({
  guest_id: z.string().uuid(),
  table_id: z.string().uuid().nullable(),
});
