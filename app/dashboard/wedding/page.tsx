import type { Metadata } from "next";

import { getWeddingTitle } from "@/lib/dashboard-metrics";
import { getCurrentUserContext } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Nunta",
};

export default async function WeddingPage() {
  const { wedding, activeWorkspace } = await getCurrentUserContext();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{getWeddingTitle(wedding)}</h1>
        <p className="mt-2 text-muted-foreground">
          Detaliile nunții pentru {activeWorkspace?.name ?? "workspace"}
        </p>
      </header>

      {!wedding ? (
        <p className="text-sm text-muted-foreground">
          Nu există încă o nuntă asociată acestui workspace.
        </p>
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
            <dd className="mt-1">{wedding.wedding_status}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
