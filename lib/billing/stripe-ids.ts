/**
 * Stripe ID helpers — Checkout must ONLY ever receive Price IDs (price_…).
 * Product IDs (prod_…) are catalog metadata and must never reach sessions.create().
 */

export function isValidStripePriceId(value: unknown): value is string {
  return typeof value === "string" && /^price_[A-Za-z0-9]+$/.test(value.trim());
}

export function isValidStripeProductId(value: unknown): value is string {
  return typeof value === "string" && /^prod_[A-Za-z0-9]+$/.test(value.trim());
}

export function looksLikeStripeProductId(value: unknown): boolean {
  return typeof value === "string" && value.trim().startsWith("prod_");
}

export const INVALID_STRIPE_PRICE_MESSAGE =
  "Selected billing plan does not have a valid Stripe Price ID configured.";

const PRODUCT_AS_PRICE_MESSAGE =
  "A Stripe Product ID (prod_…) was configured where a Price ID (price_…) is required. Update the plan's Price ID.";

/**
 * Resolve a Checkout-ready Price ID.
 * Skips empty values and Product IDs; never returns prod_….
 */
export function resolveStripePriceId(
  candidates: Array<string | null | undefined>,
): { priceId: string } | { error: string } {
  let sawProductId = false;
  for (const raw of candidates) {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) continue;
    if (looksLikeStripeProductId(value)) {
      sawProductId = true;
      continue;
    }
    if (isValidStripePriceId(value)) {
      return { priceId: value };
    }
  }
  return {
    error: sawProductId ? PRODUCT_AS_PRICE_MESSAGE : INVALID_STRIPE_PRICE_MESSAGE,
  };
}
