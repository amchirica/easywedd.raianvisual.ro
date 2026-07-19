import type { InvitationAnalytics } from "@/lib/invitations/analytics";

export function AnalyticsCards({
  stats,
  advanced,
}: {
  stats: InvitationAnalytics;
  advanced: boolean;
}) {
  const cards = [
    { label: "Trimise", value: stats.sent },
    { label: "Deschideri", value: stats.opens },
    { label: "RSVP", value: stats.rsvps },
    { label: "Rată confirmare", value: `${stats.confirmationRate}%` },
    { label: "Fără răspuns", value: stats.unanswered },
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
          Analytics avansat activ: deschideri pe clasă de device (mobile/desktop),
          fără fingerprinting.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Upgrade la Premium pentru analytics avansat.
        </p>
      )}
    </div>
  );
}
