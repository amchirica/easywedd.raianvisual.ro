import { z } from "zod";

import { VENDOR_CATEGORIES } from "@/lib/vendors/categories";

const vendorCategoryEnum = z.enum(
  VENDOR_CATEGORIES.map((c) => c.slug) as [
    (typeof VENDOR_CATEGORIES)[number]["slug"],
    ...(typeof VENDOR_CATEGORIES)[number]["slug"][],
  ],
);

export const vendorSchema = z.object({
  company_name: z.string().min(1, "validation.companyNameRequired"),
  category: vendorCategoryEnum.default("other"),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.email("validation.invalidEmail").optional().or(z.literal("")),
  website: z.string().optional(),
  social_url: z.string().optional(),
  quoted_price: z.coerce.number().nonnegative().optional(),
  contracted_price: z.coerce.number().nonnegative().optional(),
  status: z
    .enum(["offered", "contacted", "shortlist", "contracted", "rejected"])
    .default("offered"),
  contract_url: z.string().optional(),
  notes: z.string().optional(),
  due_date: z.string().optional(),
});
