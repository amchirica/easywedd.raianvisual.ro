import type { Metadata } from "next";

import { RaianVisualPromo } from "@/components/marketing/raian-visual-promo";
import { WeddingDetailsForm } from "@/components/planner/wedding-details-form";
import { getWeddingTitle } from "@/lib/dashboard-metrics";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { t } from "@/lib/i18n/t";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.wedding.title };
}

export default async function WeddingPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">{dict.wedding.title}</h1>
        <p className="text-muted-foreground">{ctx.error}</p>
      </div>
    );
  }

  const { wedding, activeWorkspace, role } = ctx.context;
  const canWrite = canManagePlanner(role);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">
          {getWeddingTitle(wedding, locale)}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t(dict as never, "wedding.forWorkspace", {
            locale,
            params: { name: activeWorkspace.name },
          })}
        </p>
      </header>

      <RaianVisualPromo
        variant="compact"
        source="wedding"
        workspaceId={ctx.context.workspaceId}
        weddingDate={wedding?.wedding_date}
      />

      {!wedding ? (
        <p className="text-sm text-muted-foreground">{dict.wedding.noWedding}</p>
      ) : canWrite ? (
        <WeddingDetailsForm wedding={wedding} />
      ) : (
        <dl className="grid gap-4 border border-border bg-card p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">
              {dict.wedding.fields.date}
            </dt>
            <dd className="mt-1">{wedding.wedding_date ?? dict.wedding.unset}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {dict.wedding.fields.city}
            </dt>
            <dd className="mt-1">{wedding.city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {dict.wedding.fields.venue}
            </dt>
            <dd className="mt-1">{wedding.venue_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {dict.wedding.fields.guestCount}
            </dt>
            <dd className="mt-1">{wedding.estimated_guest_count ?? 0}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {dict.wedding.currency}
            </dt>
            <dd className="mt-1">{wedding.currency}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {dict.wedding.fields.status}
            </dt>
            <dd className="mt-1">
              {getStatusLabel("wedding", wedding.wedding_status, locale) ||
                wedding.wedding_status}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
