"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { InvitationAnalytics } from "@/lib/invitations/analytics";

export function AnalyticsCards({
  stats,
  advanced,
}: {
  stats: InvitationAnalytics;
  advanced: boolean;
}) {
  const { dict } = useI18n();
  const cards = [
    { label: dict.invitations.sent, value: stats.sent },
    { label: dict.invitations.opens, value: stats.opens },
    { label: dict.invitations.rsvp, value: stats.rsvps },
    {
      label: dict.invitations.confirmationRate,
      value: `${stats.confirmationRate}%`,
    },
    { label: dict.invitations.unanswered, value: stats.unanswered },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="border-b border-border pb-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {card.label}
            </p>
            <p className="mt-2 font-heading text-3xl">{card.value}</p>
          </div>
        ))}
      </div>
      {advanced ? (
        <p className="text-sm text-muted-foreground">
          {dict.invitations.advancedAnalyticsOn}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {dict.invitations.upgradeAdvancedAnalytics}
        </p>
      )}
    </div>
  );
}
