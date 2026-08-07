import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWeddingSiteSettingsAction } from "@/lib/actions/website";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/t";
import { requireWeddingContext } from "@/lib/planner/context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.website.settingsMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function WebsiteSettingsPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { id } = await params;
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <EmptyState
        title={dict.shell.workspaceIncomplete}
        description={ctx.error ?? ""}
      />
    );
  }

  const { data: site } = await ctx.context.supabase
    .from("wedding_sites")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  if (!site) return <EmptyState title={dict.website.notFound} description="" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.website.settingsTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.website.settingsSubtitle}
        </p>
      </header>

      <form action={updateWeddingSiteSettingsAction} className="max-w-xl space-y-4">
        <input type="hidden" name="site_id" value={site.id} />
        <div className="space-y-1">
          <Label>{dict.website.slug}</Label>
          <Input name="slug" defaultValue={site.slug} required />
        </div>
        <div className="space-y-1">
          <Label>{dict.website.seoTitle}</Label>
          <Input name="seo_title" defaultValue={site.seo_title ?? ""} />
        </div>
        <div className="space-y-1">
          <Label>{dict.website.seoDescription}</Label>
          <Input name="seo_description" defaultValue={site.seo_description ?? ""} />
        </div>
        <div className="space-y-1">
          <Label>{dict.website.socialImageUrl}</Label>
          <Input name="social_image_url" defaultValue={site.social_image_url ?? ""} />
        </div>
        <div className="space-y-1">
          <Label>{dict.website.customDomain}</Label>
          <Input
            name="custom_domain"
            defaultValue={site.custom_domain ?? ""}
            placeholder={dict.website.domainPlaceholder}
          />
          <p className="text-xs text-muted-foreground">
            {t(dict as never, "website.domainStatus", {
              locale,
              params: { status: site.domain_status },
            })}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="password_protected"
            defaultChecked={site.password_protected}
          />
          {dict.website.passwordProtected}
        </label>
        <div className="space-y-1">
          <Label>{dict.website.newPasswordOptional}</Label>
          <Input name="password" type="password" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="analytics_enabled"
            defaultChecked={site.analytics_enabled}
          />
          {dict.website.analyticsVisits}
        </label>
        <Button type="submit">{dict.dialog.save}</Button>
      </form>
    </div>
  );
}
