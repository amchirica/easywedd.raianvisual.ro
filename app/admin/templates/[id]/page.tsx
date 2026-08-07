import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminTemplateAction } from "@/lib/actions/admin-templates";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_CATEGORIES } from "@/types/invitations";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.editTemplateMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminTemplateEditPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { id } = await params;
  const supabase = await createClient();
  const { data: template } = await supabase
    .from("invitation_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!template) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{template.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit schema / flags</p>
      </header>

      <form action={updateAdminTemplateAction} className="grid max-w-2xl gap-3">
        <input type="hidden" name="id" value={template.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nume</Label>
            <Input name="name" required defaultValue={template.name} />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input name="slug" required defaultValue={template.slug} />
          </div>
          <div className="space-y-1">
            <Label>Categorie</Label>
            <select
              name="category"
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue={template.category}
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
            <Input
              name="thumbnail_url"
              defaultValue={template.thumbnail_url ?? ""}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>template_schema JSON</Label>
          <textarea
            name="template_schema_json"
            required
            className="min-h-48 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs"
            defaultValue={JSON.stringify(template.template_schema, null, 2)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_premium"
            defaultChecked={template.is_premium}
          />{" "}
          Premium
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={template.is_active}
          />{" "}
          Activ
        </label>
        <Button type="submit">{dict.dialog.save}</Button>
      </form>
    </div>
  );
}
