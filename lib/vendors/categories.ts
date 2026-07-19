export const VENDOR_CATEGORIES = [
  { slug: "venue", label: "Locație" },
  { slug: "photography", label: "Fotografie" },
  { slug: "videography", label: "Videografie" },
  { slug: "photo_video", label: "Foto & Video" },
  { slug: "planner", label: "Wedding Planner" },
  { slug: "catering", label: "Catering" },
  { slug: "dj", label: "DJ" },
  { slug: "live_band", label: "Formație" },
  { slug: "flowers_decor", label: "Flori & Decor" },
  { slug: "cake", label: "Tort" },
  { slug: "invitations", label: "Invitații" },
  { slug: "transport", label: "Transport" },
  { slug: "accommodation", label: "Cazare" },
  { slug: "bridal_dress", label: "Rochie de mireasă" },
  { slug: "groom_suit", label: "Costum mire" },
  { slug: "makeup", label: "Machiaj" },
  { slug: "hair", label: "Coafură" },
  { slug: "jewelry", label: "Bijuterii" },
  { slug: "entertainment", label: "Divertisment" },
  { slug: "fireworks", label: "Artificii" },
  { slug: "photo_booth", label: "Cabină foto" },
  { slug: "other", label: "Altele" },
] as const;

export type VendorCategorySlug = (typeof VENDOR_CATEGORIES)[number]["slug"];

const SLUG_SET = new Set<string>(VENDOR_CATEGORIES.map((c) => c.slug));

export function isVendorCategorySlug(value: string): value is VendorCategorySlug {
  return SLUG_SET.has(value);
}

export function vendorCategoryLabel(slug: string): string {
  const found = VENDOR_CATEGORIES.find((c) => c.slug === slug);
  return found?.label ?? "Altele";
}
