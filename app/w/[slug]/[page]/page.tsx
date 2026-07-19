import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SiteCanvas } from "@/components/website/site-canvas";
import { defaultSiteTheme, siteThemeSchema } from "@/lib/website/schema";
import { createClient } from "@/lib/supabase/server";
import type { SiteSectionConfig } from "@/types/website";

type PageProps = {
  params: Promise<{ slug: string; page: string }>;
};

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function PublicWeddingSiteSubpage({ params }: PageProps) {
  const { slug, page } = await params;
  if (page === "home" || page === "unlock") {
    redirect(`/w/${slug}`);
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_wedding_site", { p_slug: slug });
  const site = data as {
    theme_config?: unknown;
    pages?: { slug: string; title: string; visibility: string }[];
    sections?: {
      id: string;
      page_id: string | null;
      section_type: string;
      section_config: SiteSectionConfig;
      is_visible: boolean;
      sort_order: number;
    }[];
  } | null;

  if (!site) {
    return (
      <main className="px-6 py-16">
        <h1 className="font-heading text-3xl">Pagină indisponibilă</h1>
      </main>
    );
  }

  const pageRow = (site.pages ?? []).find((p) => p.slug === page);
  if (!pageRow || pageRow.visibility !== "public") {
    return (
      <main className="px-6 py-16">
        <h1 className="font-heading text-3xl">Pagină indisponibilă</h1>
      </main>
    );
  }

  const theme = siteThemeSchema.safeParse(site.theme_config).success
    ? siteThemeSchema.parse(site.theme_config)
    : defaultSiteTheme();

  return (
    <main>
      <p className="px-6 pt-8 text-center text-sm text-muted-foreground">
        {pageRow.title}
      </p>
      <SiteCanvas
        theme={theme}
        sections={(site.sections ?? []).map((s) => ({
          ...s,
          section_config: s.section_config ?? {},
        }))}
      />
    </main>
  );
}
