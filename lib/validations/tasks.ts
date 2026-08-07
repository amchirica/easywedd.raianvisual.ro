import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "validation.titleRequired"),
  description: z.string().optional(),
  category: z.enum([
    "venue",
    "photo_video",
    "outfits",
    "rings",
    "ceremony",
    "invitations",
    "guests",
    "catering",
    "music",
    "decor",
    "transport",
    "accommodation",
    "honeymoon",
    "legal",
    "other",
  ]),
  status: z.enum(["todo", "in_progress", "waiting", "done", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().optional().or(z.literal("")),
  estimated_cost: z.coerce.number().nonnegative().optional(),
  actual_cost: z.coerce.number().nonnegative().optional(),
  recurrence: z.enum(["none", "weekly", "monthly"]).default("none"),
});

export type TaskInput = z.infer<typeof taskSchema>;
