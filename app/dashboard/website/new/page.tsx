import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWeddingSiteAction } from "@/lib/actions/website";
import { requireFeature } from "@/lib/entitlements/service";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/t";
import { slugifyCoupleNames } from "@/lib/website/slug";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.website.newTitle };
}

export default async function NewWebsitePage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title={dict.shell.workspaceIncomplete} description={ctx.error ?? ""} />;
  }
  if (!canManagePlanner(ctx.context.role)) {
    return <EmptyState title={dict.shell.noPermission} description="" />;
  }
  const feature = await requireFeature(ctx.context.workspaceId, "website");
  if (!feature.ok) {
    return <EmptyState title={dict.website.disabled} description={feature.error} />;
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
        <h1 className="font-heading text-4xl">{dict.website.newTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(dict as never, "website.newSubtitle", { locale, params: { slug: defaultSlug } })}
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
                {dict.website.premium}
              </p>
            ) : null}
            <div className="space-y-1">
              <Label>{dict.website.slug}</Label>
              <Input name="slug" defaultValue={defaultSlug} required />
            </div>
            <Button type="submit">{dict.website.create}</Button>
          </form>
        ))}
      </div>
    </div>
  );
}
