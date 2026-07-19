import { z } from "zod";

export const budgetItemSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  estimated_amount: z.coerce.number().nonnegative().default(0),
  contracted_amount: z.coerce.number().nonnegative().default(0),
  currency: z.enum(["RON", "EUR"]).default("RON"),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  budget_item_id: z.string().uuid(),
  amount: z.coerce.number().positive("Suma trebuie să fie pozitivă"),
  payment_date: z.string().min(1),
  payment_method: z.enum(["cash", "card", "transfer", "other"]),
  reference: z.string().optional(),
});

export const exchangeRateSchema = z.object({
  base_currency: z.enum(["RON", "EUR"]),
  quote_currency: z.enum(["RON", "EUR"]),
  rate: z.coerce.number().positive(),
  effective_on: z.string().min(1),
});
