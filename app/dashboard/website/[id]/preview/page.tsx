import type { Metadata } from "next";

import { SiteCanvas } from "@/components/website/site-canvas";
import { EmptyState } from "@/components/planner/empty-state";
import { isFeatureEnabled, requireFeature } from "@/lib/entitlements/service";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { requireWeddingContext } from "@/lib/planner/context";
import { defaultSiteTheme, siteThemeSchema } from "@/lib/website/schema";
import type { SiteSectionConfig } from "@/types/website";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.website.previewMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function PreviewWebsitePage({ params }: PageProps) {
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

  const [{ data: site }, { data: sections }, feature] = await Promise.all([
    ctx.context.supabase
      .from("wedding_sites")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", ctx.context.workspaceId)
      .maybeSingle(),
    ctx.context.supabase
      .from("wedding_site_sections")
      .select("*")
      .eq("wedding_site_id", id)
      .order("sort_order"),
    requireFeature(ctx.context.workspaceId, "website"),
  ]);

  if (!site || !feature.ok) {
    return <EmptyState title={dict.website.unavailable} description="" />;
  }

  const theme = siteThemeSchema.safeParse(site.theme_config).success
    ? siteThemeSchema.parse(site.theme_config)
    : defaultSiteTheme();

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-4xl">{dict.website.preview}</h1>
      <div className="mx-auto max-w-xl border border-border">
        <SiteCanvas
          theme={theme}
          showBranding={!isFeatureEnabled(feature.snapshot.rows, "remove_branding")}
          sections={(sections ?? []).map((s) => ({
            id: s.id,
            section_type: s.section_type,
            section_config: (s.section_config ?? {}) as SiteSectionConfig,
            is_visible: s.is_visible,
            sort_order: s.sort_order,
          }))}
        />
      </div>
    </div>
  );
}
