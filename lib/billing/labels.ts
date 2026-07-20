/** Shared Romanian labels — safe for client and server. */

export const ACCESS_SOURCE_LABELS: Record<string, string> = {
  stripe_subscription: "Abonament Stripe",
  stripe_one_time: "Plată unică Stripe",
  admin_grant: "Acord admin",
  trial: "Trial",
  partner: "Partener / client",
  legacy: "Legacy",
};

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  pending_signature: "Așteaptă semnătură",
  active: "Activ",
  expired: "Expirat",
  canceled: "Anulat",
  completed: "Finalizat",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Activ",
  past_due: "Restanță",
  canceled: "Anulat",
  incomplete: "Incomplet",
};
