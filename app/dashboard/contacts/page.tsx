import type { Metadata } from "next";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { EmptyState } from "@/components/planner/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createContactAction,
  deleteContactAction,
} from "@/lib/actions/contacts";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";

export const metadata: Metadata = { title: "Contacte" };

const CONTACT_TYPES = [
  ["parents", "Părinți"],
  ["godparents", "Nași"],
  ["bridesmaids", "Domnișoare de onoare"],
  ["groomsmen", "Cavaleri"],
  ["restaurant", "Restaurant"],
  ["dj", "DJ"],
  ["photo_video", "Foto-video"],
  ["transport", "Transport"],
  ["accommodation", "Cazare"],
  ["emergency", "Urgențe"],
  ["other", "Altele"],
] as const;

export default async function ContactsPage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }

  const canWrite = canManagePlanner(ctx.context.role);
  const { data: contacts } = await ctx.context.supabase
    .from("wedding_contacts")
    .select("*")
    .eq("wedding_id", ctx.context.weddingId)
    .order("contact_type");

  const grouped = CONTACT_TYPES.map(([value, label]) => ({
    value,
    label,
    items: (contacts ?? []).filter((c) => c.contact_type === value),
  })).filter((g) => g.items.length > 0 || canWrite);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Agenda de contacte</h1>
        <p className="mt-2 text-muted-foreground">
          Părinți, nași, restaurant, foto-video, urgențe și restul echipei.
        </p>
      </header>

      {canWrite ? (
        <form
          action={createContactAction}
          className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1">
            <Label>Tip</Label>
            <select
              name="contact_type"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="other"
            >
              {CONTACT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Nume</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label>Rol</Label>
            <Input name="role_label" />
          </div>
          <div className="space-y-1">
            <Label>Telefon</Label>
            <Input name="phone" />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input name="email" type="email" />
          </div>
          <div className="space-y-1">
            <Label>Notițe</Label>
            <Input name="notes" />
          </div>
          <Button type="submit">Adaugă contact</Button>
        </form>
      ) : null}

      {(contacts ?? []).length === 0 ? (
        <EmptyState
          title="Niciun contact"
          description="Adaugă persoanele importante pentru ziua nunții."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) =>
            group.items.length === 0 ? null : (
              <section key={group.value}>
                <h2 className="font-heading text-2xl">{group.label}</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {group.items.map((contact) => (
                    <article
                      key={contact.id}
                      className="border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[contact.role_label, contact.phone, contact.email]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {contact.notes ? (
                            <p className="mt-2 text-sm">{contact.notes}</p>
                          ) : null}
                        </div>
                        {canWrite ? (
                          <ConfirmDeleteButton
                            id={contact.id}
                            action={deleteContactAction}
                          />
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
