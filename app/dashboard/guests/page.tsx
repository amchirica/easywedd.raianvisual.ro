import type { Metadata } from "next";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { CsvDownloadButton } from "@/components/planner/csv-download-button";
import { EmptyState } from "@/components/planner/empty-state";
import { RsvpLinkButton } from "@/components/planner/rsvp-link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  anonymizeGuestAction,
  createGuestAction,
  createGuestGroupAction,
  createRsvpLinkAction,
  deleteGuestAction,
  exportGuestsCsvAction,
  importGuestsCsvAction,
} from "@/lib/actions/guests";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { canAccessFeature, canManageGuests } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { findDuplicateGuests } from "@/lib/planner/duplicates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.guests.title };
}

type GuestsPageProps = {
  searchParams: Promise<{ q?: string; side?: string; rsvp?: string }>;
};

function sideLabel(
  side: string,
  dict: Awaited<ReturnType<typeof getDictionary>>,
) {
  switch (side) {
    case "bride":
      return dict.guests.sideBride;
    case "groom":
      return dict.guests.sideGroom;
    case "both":
      return dict.guests.sideBoth;
    default:
      return dict.guests.sideOther;
  }
}

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <EmptyState
        title={dict.shell.workspaceIncomplete}
        description={ctx.error ?? ""}
      />
    );
  }
  if (!canAccessFeature(ctx.context.entitlements, "guests")) {
    return (
      <EmptyState
        title={dict.shell.moduleDisabled}
        description={dict.shell.moduleDisabledDesc}
      />
    );
  }

  const canWrite = canManageGuests(ctx.context.role);
  const [{ data: guests }, { data: groups }] = await Promise.all([
    ctx.context.supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", ctx.context.weddingId)
      .order("last_name"),
    ctx.context.supabase
      .from("guest_groups")
      .select("*")
      .eq("wedding_id", ctx.context.weddingId)
      .order("name"),
  ]);

  let filtered = guests ?? [];
  if (params.side && params.side !== "all") {
    filtered = filtered.filter((g) => g.side === params.side);
  }
  if (params.rsvp && params.rsvp !== "all") {
    filtered = filtered.filter((g) => g.rsvp_status === params.rsvp);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter((g) =>
      `${g.first_name} ${g.last_name} ${g.email ?? ""} ${g.phone ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }

  const duplicates = findDuplicateGuests(guests ?? []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">{dict.guests.title}</h1>
          <p className="mt-2 text-muted-foreground">{dict.guests.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvDownloadButton
            filename="invitati-easywedd.csv"
            action={exportGuestsCsvAction}
          />
        </div>
      </header>

      <form method="get" className="grid gap-2 sm:grid-cols-4">
        <Input name="q" placeholder={dict.guests.search} defaultValue={params.q} />
        <select
          name="side"
          defaultValue={params.side ?? "all"}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">{dict.guests.allSides}</option>
          <option value="bride">{dict.guests.sideBride}</option>
          <option value="groom">{dict.guests.sideGroom}</option>
          <option value="both">{dict.guests.sideBoth}</option>
          <option value="other">{dict.guests.sideOther}</option>
        </select>
        <select
          name="rsvp"
          defaultValue={params.rsvp ?? "all"}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">{dict.guests.allRsvp}</option>
          <option value="pending">
            {getStatusLabel("rsvp", "pending", locale)}
          </option>
          <option value="confirmed">
            {getStatusLabel("rsvp", "confirmed", locale)}
          </option>
          <option value="declined">
            {getStatusLabel("rsvp", "declined", locale)}
          </option>
          <option value="maybe">{getStatusLabel("rsvp", "maybe", locale)}</option>
        </select>
        <Button type="submit" variant="outline">
          {dict.guests.filter}
        </Button>
      </form>

      {duplicates.length > 0 ? (
        <div className="border border-champagne/40 bg-secondary px-4 py-3 text-sm">
          {dict.guests.duplicatesDetected.replace(
            "{count}",
            String(duplicates.length),
          )}
        </div>
      ) : null}

      {canWrite ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form
            action={createGuestAction}
            className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2"
          >
            <h2 className="font-heading text-2xl sm:col-span-2">{dict.guests.add}</h2>
            <div className="space-y-1">
              <Label>{dict.guests.fields.firstName}</Label>
              <Input name="first_name" required />
            </div>
            <div className="space-y-1">
              <Label>{dict.guests.fields.lastName}</Label>
              <Input name="last_name" />
            </div>
            <div className="space-y-1">
              <Label>{dict.guests.fields.email}</Label>
              <Input name="email" type="email" />
            </div>
            <div className="space-y-1">
              <Label>{dict.guests.fields.phone}</Label>
              <Input name="phone" />
            </div>
            <div className="space-y-1">
              <Label>{dict.guests.columns.side}</Label>
              <select
                name="side"
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue="other"
              >
                <option value="bride">{dict.guests.sideBride}</option>
                <option value="groom">{dict.guests.sideGroom}</option>
                <option value="both">{dict.guests.sideBoth}</option>
                <option value="other">{dict.guests.sideOther}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>{dict.guests.columns.party}</Label>
              <select
                name="group_id"
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue=""
              >
                <option value="">{dict.guests.noGroup}</option>
                {(groups ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{dict.guests.adults}</Label>
              <Input name="attendance_count" type="number" defaultValue={1} />
            </div>
            <div className="space-y-1">
              <Label>{dict.guests.children}</Label>
              <Input name="children_count" type="number" defaultValue={0} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{dict.guests.columns.menu}</Label>
              <Input
                name="allergies"
                placeholder={dict.guests.allergiesPlaceholder}
              />
              <Input
                name="meal_preference"
                className="mt-2"
                placeholder={dict.guests.mealPreferencePlaceholder}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="transport_needed" />{" "}
              {dict.guests.transport}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="accommodation_needed" />{" "}
              {dict.guests.accommodation}
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="consent_to_contact" />{" "}
              {dict.guests.consentToContact}
            </label>
            <Button type="submit" className="sm:col-span-2">
              {dict.guests.add}
            </Button>
          </form>

          <div className="space-y-4">
            <form
              action={createGuestGroupAction}
              className="space-y-3 border border-border bg-card p-4"
            >
              <h2 className="font-heading text-2xl">{dict.guests.groupFamily}</h2>
              <Input
                name="name"
                required
                placeholder={dict.guests.groupPlaceholder}
              />
              <Button type="submit" variant="outline">
                {dict.guests.addGroup}
              </Button>
            </form>
            <form
              action={importGuestsCsvAction}
              className="space-y-3 border border-border bg-card p-4"
            >
              <h2 className="font-heading text-2xl">{dict.guests.importCsv}</h2>
              <p className="text-xs text-muted-foreground">
                {dict.guests.importHint}
              </p>
              <Input name="file" type="file" accept=".csv,text/csv" required />
              <Button type="submit" variant="outline">
                {dict.guests.importSubmit}
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title={dict.guests.emptyTitle}
          description={dict.guests.emptyDescription}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{dict.guests.columns.name}</th>
                  <th className="px-4 py-3">{dict.guests.columns.side}</th>
                  <th className="px-4 py-3">{dict.guests.columns.rsvp}</th>
                  <th className="px-4 py-3">
                    {dict.guests.columns.adultsChildren}
                  </th>
                  <th className="px-4 py-3">{dict.guests.columns.needs}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => (
                  <tr key={guest.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {guest.first_name} {guest.last_name}
                      {guest.is_anonymized ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {dict.guests.anonymized}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {sideLabel(guest.side, dict)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusLabel("rsvp", guest.rsvp_status, locale) ||
                        guest.rsvp_status}
                    </td>
                    <td className="px-4 py-3">
                      {guest.attendance_count}/{guest.children_count}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {[
                        guest.transport_needed ? dict.guests.needTransport : null,
                        guest.accommodation_needed
                          ? dict.guests.needAccommodation
                          : null,
                        guest.allergies ? dict.guests.needAllergies : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "?"}
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && !guest.is_anonymized ? (
                        <div className="flex flex-wrap gap-2">
                          <RsvpLinkButton
                            guestId={guest.id}
                            action={createRsvpLinkAction}
                          />
                          <ConfirmDeleteButton
                            label={dict.guests.anonymize}
                            confirmLabel={dict.guests.confirmAnonymize}
                            id={guest.id}
                            action={anonymizeGuestAction}
                          />
                          <ConfirmDeleteButton
                            id={guest.id}
                            action={deleteGuestAction}
                          />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {filtered.map((guest) => (
              <article key={guest.id} className="border border-border bg-card p-4">
                <p className="font-medium">
                  {guest.first_name} {guest.last_name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sideLabel(guest.side, dict)} ·{" "}
                  {getStatusLabel("rsvp", guest.rsvp_status, locale) ||
                    guest.rsvp_status}{" "}
                  · {guest.attendance_count}/{guest.children_count}
                </p>
                {canWrite && !guest.is_anonymized ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <RsvpLinkButton guestId={guest.id} action={createRsvpLinkAction} />
                    <ConfirmDeleteButton
                      id={guest.id}
                      action={deleteGuestAction}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
