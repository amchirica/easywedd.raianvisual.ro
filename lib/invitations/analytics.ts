export type InvitationAnalytics = {
  sent: number;
  opens: number;
  rsvps: number;
  confirmationRate: number;
  unanswered: number;
};

export function computeInvitationAnalytics(input: {
  deliveriesSent: number;
  opens: number;
  rsvps: number;
  recipientsTotal: number;
}): InvitationAnalytics {
  const unanswered = Math.max(input.recipientsTotal - input.rsvps, 0);
  const confirmationRate =
    input.recipientsTotal > 0
      ? Math.round((input.rsvps / input.recipientsTotal) * 100)
      : 0;

  return {
    sent: input.deliveriesSent,
    opens: input.opens,
    rsvps: input.rsvps,
    confirmationRate,
    unanswered,
  };
}

export function deviceClassFromUa(ua: string | null | undefined) {
  if (!ua) return "unknown";
  const value = ua.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(value)) return "mobile";
  if (/tablet/.test(value)) return "tablet";
  return "desktop";
}
