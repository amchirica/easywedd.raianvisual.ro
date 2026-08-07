import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { EmptyState } from "@/components/planner/empty-state";
import { WebsiteEditorLoading } from "@/components/shared/module-loading";
import {
  isFeatureEnabled,
  requireFeature,
} from "@/lib/entitlements/service";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/t";
import { requireWeddingContext } from "@/lib/planner/context";
import { defaultSiteTheme, siteThemeSchema } from "@/lib/website/schema";
import type { SiteSectionConfig } from "@/types/website";

const SiteSectionEditor = dynamic(
  () =>
    import("@/components/website/site-section-editor").then((m) => ({
      default: m.SiteSectionEditor,
    })),
  { loading: () => <WebsiteEditorLoading /> },
);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.website.editMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function EditWebsitePage({ params }: PageProps) {
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
    return (
      <EmptyState
        title={dict.website.unavailable}
        description={feature.ok ? "" : feature.error}
      />
    );
  }

  const themeParsed = siteThemeSchema.safeParse(site.theme_config);
  const theme = themeParsed.success ? themeParsed.data : defaultSiteTheme();
  const canPublish = isFeatureEnabled(feature.snapshot.rows, "website_publish");
  const showBranding = !isFeatureEnabled(feature.snapshot.rows, "remove_branding");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.website.builderTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(dict as never, "website.builderSubtitle", {
            locale,
            params: { slug: site.slug },
          })}
        </p>
      </header>
      <SiteSectionEditor
        siteId={site.id}
        initialTheme={theme}
        status={site.status}
        canPublish={canPublish}
        showBranding={showBranding}
        initialSections={(sections ?? []).map((s) => ({
          id: s.id,
          section_type: s.section_type,
          section_config: (s.section_config ?? {}) as SiteSectionConfig,
          is_visible: s.is_visible,
          sort_order: s.sort_order,
        }))}
      />
    </div>
  );
}
