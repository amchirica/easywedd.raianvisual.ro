import type { Metadata } from "next";

import { RaianVisualPromo } from "@/components/marketing/raian-visual-promo";
import { WeddingDetailsForm } from "@/components/planner/wedding-details-form";
import { getWeddingTitle } from "@/lib/dashboard-metrics";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { WEDDING_STATUS_LABELS } from "@/lib/validations/wedding";

export const metadata: Metadata = {
  title: "Nunta",
};

export default async function WeddingPage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">Nunta</h1>
        <p className="text-muted-foreground">{ctx.error}</p>
      </div>
    );
  }

  const { wedding, activeWorkspace, role } = ctx.context;
  const canWrite = canManagePlanner(role);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{getWeddingTitle(wedding)}</h1>
        <p className="mt-2 text-muted-foreground">
          Detaliile nunții pentru {activeWorkspace.name}
        </p>
      </header>

      <RaianVisualPromo
        variant="compact"
        source="wedding"
        workspaceId={ctx.context.workspaceId}
        weddingDate={wedding?.wedding_date}
      />

      {!wedding ? (
        <p className="text-sm text-muted-foreground">
          Nu există încă o nuntă asociată acestui workspace.
        </p>
      ) : canWrite ? (
        <WeddingDetailsForm wedding={wedding} />
      ) : (
        <dl className="grid gap-4 border border-border bg-card p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Data nunții</dt>
            <dd className="mt-1">{wedding.wedding_date ?? "Nesetată"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Oraș</dt>
            <dd className="mt-1">{wedding.city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Locație</dt>
            <dd className="mt-1">{wedding.venue_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Invitați estimați</dt>
            <dd className="mt-1">{wedding.estimated_guest_count ?? 0}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Monedă</dt>
            <dd className="mt-1">{wedding.currency}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="mt-1">
              {WEDDING_STATUS_LABELS[wedding.wedding_status] ??
                wedding.wedding_status}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
