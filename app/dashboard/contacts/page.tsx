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
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { requireWeddingContext } from "@/lib/planner/context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.contacts.title };
}

const CONTACT_TYPE_KEYS = [
  "parents",
  "godparents",
  "bridesmaids",
  "groomsmen",
  "restaurant",
  "dj",
  "photo_video",
  "transport",
  "accommodation",
  "emergency",
  "other",
] as const;

export default async function ContactsPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title={dict.shell.workspaceIncomplete} description={ctx.error ?? ""} />;
  }

  const canWrite = canManagePlanner(ctx.context.role);
  const { data: contacts } = await ctx.context.supabase
    .from("wedding_contacts")
    .select("*")
    .eq("wedding_id", ctx.context.weddingId)
    .order("contact_type");

  const typeLabel = (value: (typeof CONTACT_TYPE_KEYS)[number]) =>
    dict.contacts.types[value];

  const grouped = CONTACT_TYPE_KEYS.map((value) => ({
    value,
    label: typeLabel(value),
    items: (contacts ?? []).filter((c) => c.contact_type === value),
  })).filter((g) => g.items.length > 0 || canWrite);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">{dict.contacts.title}</h1>
        <p className="mt-2 text-muted-foreground">{dict.contacts.subtitle}</p>
      </header>

      {canWrite ? (
        <form
          action={createContactAction}
          className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1">
            <Label>{dict.contacts.type}</Label>
            <select
              name="contact_type"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="other"
            >
              {CONTACT_TYPE_KEYS.map((value) => (
                <option key={value} value={value}>
                  {typeLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{dict.contacts.name}</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label>{dict.contacts.role}</Label>
            <Input name="role_label" />
          </div>
          <div className="space-y-1">
            <Label>{dict.contacts.phone}</Label>
            <Input name="phone" />
          </div>
          <div className="space-y-1">
            <Label>{dict.contacts.email}</Label>
            <Input name="email" type="email" />
          </div>
          <div className="space-y-1">
            <Label>{dict.contacts.notes}</Label>
            <Input name="notes" />
          </div>
          <Button type="submit">{dict.contacts.add}</Button>
        </form>
      ) : null}

      {(contacts ?? []).length === 0 ? (
        <EmptyState
          title={dict.contacts.emptyTitle}
          description={dict.contacts.emptyDescription}
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
