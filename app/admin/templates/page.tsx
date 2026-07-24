import type { Metadata } from "next";
import Link from "next/link";

import { AdminTemplateDeleteButton } from "@/components/admin/admin-deletion-controls";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAdminTemplateAction,
  duplicateAdminTemplateAction,
  toggleAdminTemplateActiveAction,
} from "@/lib/actions/admin-templates";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { TEMPLATE_CATEGORIES } from "@/types/invitations";

export const metadata: Metadata = { title: "Admin Templates" };

export default async function AdminTemplatesPage() {
  const supabase = await createClient();
  const [{ data: templates }, { data: siteTemplates }] = await Promise.all([
    supabase
      .from("invitation_templates")
      .select(
        "id, name, slug, category, is_active, is_premium, thumbnail_url, created_at",
      )
      .order("name")
      .limit(100),
    supabase
      .from("wedding_site_templates")
      .select("id, name, slug, is_active, is_premium, created_at")
      .order("name")
      .limit(100),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-4xl">Invitation templates</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          CRUD catalog global · thumbnail ca URL în V1
        </p>
      </header>

      <form action={createAdminTemplateAction} className="grid max-w-2xl gap-3">
        <h2 className="font-heading text-2xl">Template nou</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nume</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input name="slug" required placeholder="my-template" />
          </div>
          <div className="space-y-1">
            <Label>Categorie</Label>
            <select
              name="category"
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="elegant"
            >
              {TEMPLATE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Thumbnail URL</Label>
            <Input name="thumbnail_url" placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-1">
          <Label>template_schema JSON</Label>
          <textarea
            name="template_schema_json"
            required
            className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs"
            defaultValue={JSON.stringify(
              {
                sections: ["hero", "couple", "when_where", "rsvp", "footer"],
                theme: {
                  background: "#F7F4EF",
                  foreground: "#2A2420",
                  accent: "#C4A574",
                  headingFont: "Cormorant Garamond",
                  bodyFont: "Source Sans 3",
                },
              },
              null,
              2,
            )}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_premium" /> Premium
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked /> Activ
        </label>
        <Button type="submit">Creează</Button>
      </form>

      <div className="divide-y divide-border border-y border-border">
        {(templates ?? []).map((template) => (
          <div
            key={template.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-heading text-xl">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {template.slug} · {template.category}
                {template.is_premium ? " · premium" : ""}
                {template.is_active ? " · activ" : " · inactiv"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/templates/${template.id}`}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Editează
              </Link>
              <form action={duplicateAdminTemplateAction.bind(null, template.id)}>
                <Button type="submit" size="sm" variant="outline">
                  Duplică
                </Button>
              </form>
              <form
                action={toggleAdminTemplateActiveAction.bind(
                  null,
                  template.id,
                  !template.is_active,
                )}
              >
                <Button type="submit" size="sm" variant="outline">
                  {template.is_active ? "Dezactivează" : "Activează"}
                </Button>
              </form>
              <AdminTemplateDeleteButton
                templateId={template.id}
                name={template.name}
                kind="invitation"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-2xl">Website templates</h2>
        <div className="divide-y divide-border border-y border-border">
          {(siteTemplates ?? []).map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-heading text-xl">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.slug}
                  {template.is_premium ? " · premium" : ""}
                  {template.is_active ? " · activ" : " · inactiv"}
                </p>
              </div>
              <AdminTemplateDeleteButton
                templateId={template.id}
                name={template.name}
                kind="website"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
