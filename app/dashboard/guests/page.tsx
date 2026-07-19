import type { Metadata } from "next";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { CsvDownloadButton } from "@/components/planner/csv-download-button";
import { EmptyState } from "@/components/planner/empty-state";
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
import { canAccessFeature, canManageGuests } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { findDuplicateGuests } from "@/lib/planner/duplicates";
import { RsvpLinkButton } from "@/components/planner/rsvp-link-button";

export const metadata: Metadata = { title: "Invitați" };

type GuestsPageProps = {
  searchParams: Promise<{ q?: string; side?: string; rsvp?: string }>;
};

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const params = await searchParams;
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }
  if (!canAccessFeature(ctx.context.entitlements, "guests")) {
    return (
      <EmptyState
        title="Modul dezactivat"
        description="Entitlement-ul guests nu este activ."
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
          <h1 className="font-heading text-4xl">Invitați</h1>
          <p className="mt-2 text-muted-foreground">
            Datele personale (telefon, email, alergii) sunt protejate prin RLS.
            Nu se folosesc automat pentru marketing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvDownloadButton
            filename="invitati-easywedd.csv"
            action={exportGuestsCsvAction}
          />
        </div>
      </header>

      <form method="get" className="grid gap-2 sm:grid-cols-4">
        <Input name="q" placeholder="Caută..." defaultValue={params.q} />
        <select
          name="side"
          defaultValue={params.side ?? "all"}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Toate părțile</option>
          <option value="bride">Mireasă</option>
          <option value="groom">Mire</option>
          <option value="both">Amândoi</option>
          <option value="other">Altele</option>
        </select>
        <select
          name="rsvp"
          defaultValue={params.rsvp ?? "all"}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Toate RSVP</option>
          <option value="pending">În așteptare</option>
          <option value="confirmed">Confirmat</option>
          <option value="declined">Refuzat</option>
          <option value="maybe">Poate</option>
        </select>
        <Button type="submit" variant="outline">
          Filtrează
        </Button>
      </form>

      {duplicates.length > 0 ? (
        <div className="border border-champagne/40 bg-secondary px-4 py-3 text-sm">
          Posibile duplicate detectate: {duplicates.length} grupuri.
        </div>
      ) : null}

      {canWrite ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form
            action={createGuestAction}
            className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2"
          >
            <h2 className="font-heading text-2xl sm:col-span-2">Adaugă invitat</h2>
            <div className="space-y-1">
              <Label>Prenume</Label>
              <Input name="first_name" required />
            </div>
            <div className="space-y-1">
              <Label>Nume</Label>
              <Input name="last_name" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input name="email" type="email" />
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input name="phone" />
            </div>
            <div className="space-y-1">
              <Label>Parte</Label>
              <select
                name="side"
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue="other"
              >
                <option value="bride">Mireasă</option>
                <option value="groom">Mire</option>
                <option value="both">Amândoi</option>
                <option value="other">Altele</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Grup</Label>
              <select
                name="group_id"
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue=""
              >
                <option value="">Fără grup</option>
                {(groups ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Adulți</Label>
              <Input name="attendance_count" type="number" defaultValue={1} />
            </div>
            <div className="space-y-1">
              <Label>Copii</Label>
              <Input name="children_count" type="number" defaultValue={0} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Alergii / meniu</Label>
              <Input name="allergies" placeholder="Alergii" />
              <Input name="meal_preference" className="mt-2" placeholder="Preferință meniu" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="transport_needed" /> Transport
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="accommodation_needed" /> Cazare
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="consent_to_contact" /> Consimțământ contact
            </label>
            <Button type="submit" className="sm:col-span-2">
              Salvează invitat
            </Button>
          </form>

          <div className="space-y-4">
            <form
              action={createGuestGroupAction}
              className="space-y-3 border border-border bg-card p-4"
            >
              <h2 className="font-heading text-2xl">Grup / familie</h2>
              <Input name="name" required placeholder="Ex. Familia Ionescu" />
              <Button type="submit" variant="outline">
                Adaugă grup
              </Button>
            </form>
            <form
              action={importGuestsCsvAction}
              className="space-y-3 border border-border bg-card p-4"
            >
              <h2 className="font-heading text-2xl">Import CSV</h2>
              <p className="text-xs text-muted-foreground">
                Coloane: first_name, last_name, email, phone, side, relationship,
                meal_preference, allergies
              </p>
              <Input name="file" type="file" accept=".csv,text/csv" required />
              <Button type="submit" variant="outline">
                Importă
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="Niciun invitat"
          description="Adaugă invitați individual sau importă un CSV."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nume</th>
                  <th className="px-4 py-3">Parte</th>
                  <th className="px-4 py-3">RSVP</th>
                  <th className="px-4 py-3">Adulți/Copii</th>
                  <th className="px-4 py-3">Nevoi</th>
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
                          (anonimizat)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{guest.side}</td>
                    <td className="px-4 py-3">{guest.rsvp_status}</td>
                    <td className="px-4 py-3">
                      {guest.attendance_count}/{guest.children_count}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {[
                        guest.transport_needed ? "transport" : null,
                        guest.accommodation_needed ? "cazare" : null,
                        guest.allergies ? "alergii" : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && !guest.is_anonymized ? (
                        <div className="flex flex-wrap gap-2">
                          <RsvpLinkButton
                            guestId={guest.id}
                            action={createRsvpLinkAction}
                          />
                          <ConfirmDeleteButton
                            label="Anonimizează"
                            confirmLabel="Confirmă anonimizarea"
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
                  {guest.side} · {guest.rsvp_status} · {guest.attendance_count} adulți /{" "}
                  {guest.children_count} copii
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
