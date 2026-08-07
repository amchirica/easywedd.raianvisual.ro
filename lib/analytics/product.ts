import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const PRODUCT_EVENT_NAMES = [
  "workspace_created",
  "onboarding_completed",
  "wedding_created",
  "guest_added",
  "guest_imported",
  "budget_item_added",
  "vendor_added",
  "invitation_created",
  "invitation_published",
  "invitation_opened",
  "rsvp_submitted",
  "wedding_site_created",
  "wedding_site_published",
  "subscription_started",
  "subscription_upgraded",
  "subscription_cancelled",
  "raian_visual_promo_click",
  "assistant_ask",
  "assistant_feedback",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

const PII_KEYS = new Set([
  "email",
  "phone",
  "first_name",
  "last_name",
  "full_name",
  "name",
  "address",
  "notes",
  "note",
  "message",
  "password",
]);

export function sanitizeEventProperties(
  properties?: Record<string, unknown>,
): Record<string, unknown> {
  if (!properties) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (PII_KEYS.has(key.toLowerCase())) continue;
    if (typeof value === "string" && value.includes("@")) continue;
    out[key] = value;
  }
  return out;
}

export async function trackProductEvent(
  eventName: ProductEventName,
  input: {
    workspaceId?: string | null;
    userId?: string | null;
    properties?: Record<string, unknown>;
  },
) {
  try {
    const supabase = await createClient();
    await supabase.from("product_events").insert({
      workspace_id: input.workspaceId ?? null,
      user_id: input.userId ?? null,
      event_name: eventName,
      properties: sanitizeEventProperties(input.properties) as Json,
    });
  } catch (error) {
    console.info("[product_event:skip]", eventName, error);
  }
}
