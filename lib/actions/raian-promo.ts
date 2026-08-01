"use server";

import { trackProductEvent } from "@/lib/analytics/product";

export async function trackRaianVisualPromoClickAction(input: {
  source: string;
  destination: string;
  workspaceId?: string | null;
  weddingDate?: string | null;
}) {
  await trackProductEvent("raian_visual_promo_click", {
    workspaceId: input.workspaceId ?? null,
    properties: {
      source: input.source,
      destination: input.destination,
      ...(input.weddingDate ? { wedding_date: input.weddingDate } : {}),
    },
  });
}
