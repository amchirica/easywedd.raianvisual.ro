import type { Metadata } from "next";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { EmptyState } from "@/components/planner/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addVendorDocumentAction,
  createVendorAction,
  deleteVendorAction,
  updateVendorStatusAction,
} from "@/lib/actions/vendors";
import { canAccessFeature, canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { VendorStatusButtons } from "@/components/planner/vendor-status-buttons";
import {
  VENDOR_CATEGORIES,
  vendorCategoryLabel,
} from "@/lib/vendors/categories";

export const metadata: Metadata = { title: "Furnizori" };

export default async function VendorsPage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }
  if (!canAccessFeature(ctx.context.entitlements, "vendors")) {
    return (
      <EmptyState
        title="Modul dezactivat"
        description="Entitlement-ul vendors nu este activ."
      />
    );
  }

  const canWrite = canManagePlanner(ctx.context.role);
  const { data: vendors } = await ctx.context.supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", ctx.context.weddingId)
    .order("created_at", { ascending: false });

  const { data: documents } = await ctx.context.supabase
    .from("vendor_documents")
    .select("*")
    .eq("workspace_id", ctx.context.workspaceId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Vendor CRM</h1>
        <p className="mt-2 text-muted-foreground">
          Pipeline: ofertat → contactat → shortlist → contractat / refuzat.
        </p>
      </header>

      {canWrite ? (
        <form
          action={createVendorAction}
          className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1">
            <Label>Companie</Label>
            <Input name="company_name" required />
          </div>
          <div className="space-y-1">
            <Label>Categorie</Label>
            <select
              name="category"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="photo_video"
              required
            >
              {VENDOR_CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Contact</Label>
            <Input name="contact_name" />
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
            <Label>Preț ofertat</Label>
            <Input name="quoted_price" type="number" step="0.01" />
          </div>
          <div className="space-y-1">
            <Label>Termen</Label>
            <Input name="due_date" type="date" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Notițe</Label>
            <Input name="notes" />
          </div>
          <Button type="submit">Adaugă furnizor</Button>
        </form>
      ) : null}

      {(vendors ?? []).length === 0 ? (
        <EmptyState
          title="Niciun furnizor"
          description="Adaugă primul furnizor în pipeline."
        />
      ) : (
        <div className="space-y-4">
          {(vendors ?? []).map((vendor) => {
            const docs = (documents ?? []).filter((d) => d.vendor_id === vendor.id);
            return (
              <article key={vendor.id} className="border border-border bg-card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                  <div>
                    <h2 className="font-heading text-2xl">{vendor.company_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {vendorCategoryLabel(vendor.category)} · {vendor.status}
                      {vendor.due_date ? ` · termen ${vendor.due_date}` : ""}
                    </p>
                    <p className="mt-2 text-sm">
                      {[vendor.contact_name, vendor.phone, vendor.email]
                        .filter(Boolean)
                        .join(" · ") || "Fără date de contact"}
                    </p>
                    {vendor.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">{vendor.notes}</p>
                    ) : null}
                    {docs.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs">
                        {docs.map((doc) => (
                          <li key={doc.id}>
                            <a
                              href={doc.document_url}
                              className="underline underline-offset-2"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {doc.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {canWrite ? (
                    <div className="space-y-2">
                      <VendorStatusButtons
                        vendorId={vendor.id}
                        current={vendor.status}
                        onChange={updateVendorStatusAction}
                      />
                      <ConfirmDeleteButton
                        id={vendor.id}
                        action={deleteVendorAction}
                      />
                    </div>
                  ) : null}
                </div>
                {canWrite ? (
                  <form
                    action={addVendorDocumentAction}
                    className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-4"
                  >
                    <input type="hidden" name="vendor_id" value={vendor.id} />
                    <Input name="title" placeholder="Titlu document" required />
                    <Input name="document_url" placeholder="URL contract/document" required />
                    <Input name="document_type" placeholder="Tip" />
                    <Button type="submit" variant="outline">
                      Adaugă document
                    </Button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
