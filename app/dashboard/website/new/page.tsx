import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWeddingSiteAction } from "@/lib/actions/website";
import { requireFeature } from "@/lib/entitlements/service";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { slugifyCoupleNames } from "@/lib/website/slug";

export const metadata: Metadata = { title: "Site nou" };

export default async function NewWebsitePage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }
  if (!canManagePlanner(ctx.context.role)) {
    return <EmptyState title="Fără permisiune" description="" />;
  }
  const feature = await requireFeature(ctx.context.workspaceId, "website");
  if (!feature.ok) {
    return <EmptyState title="Website dezactivat" description={feature.error} />;
  }

  const { data: templates } = await ctx.context.supabase
    .from("wedding_site_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const wedding = ctx.context.wedding!;
  const defaultSlug = slugifyCoupleNames(
    wedding.couple_name_1 ?? "",
    wedding.couple_name_2 ?? "",
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Alege un template</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Slug public: /w/{defaultSlug}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {(templates ?? []).map((template) => (
          <form
            key={template.id}
            action={createWeddingSiteAction}
            className="space-y-3 border border-border p-4"
          >
            <input type="hidden" name="template_id" value={template.id} />
            <div
              className="h-24"
              style={{
                background:
                  ((template.template_schema as { theme?: { background?: string } })
                    ?.theme?.background as string) || "#F7F4EF",
              }}
            />
            <p className="font-heading text-xl">{template.name}</p>
            {template.is_premium ? (
              <p className="text-[10px] uppercase tracking-wide text-champagne">
                Premium
              </p>
            ) : null}
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input name="slug" defaultValue={defaultSlug} required />
            </div>
            <Button type="submit">Creează</Button>
          </form>
        ))}
      </div>
    </div>
  );
}
