import { createHash } from "crypto";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import { SiteCanvas } from "@/components/website/site-canvas";
import { deviceClassFromUa } from "@/lib/invitations/analytics";
import { defaultSiteTheme, siteThemeSchema } from "@/lib/website/schema";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/url";
import type { SiteSectionConfig, SiteThemeConfig } from "@/types/website";

type PageProps = { params: Promise<{ slug: string }> };

type PublicSite = {
  id: string;
  slug: string;
  seo_title?: string | null;
  seo_description?: string | null;
  social_image_url?: string | null;
  password_protected?: boolean;
  theme_config?: unknown;
  analytics_enabled?: boolean;
  sections?: {
    id: string;
    section_type: string;
    section_config: SiteSectionConfig;
    is_visible: boolean;
    sort_order: number;
  }[];
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_wedding_site", { p_slug: slug });
  const site = data as PublicSite | null;
  if (!site) {
    return { title: "Site indisponibil", robots: { index: false, follow: false } };
  }

  const appUrl = getSiteUrl();
  const title = site.seo_title || `Nuntă · ${site.slug}`;
  const description = site.seo_description || undefined;

  return {
    title,
    description,
    robots: site.password_protected
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      images: site.social_image_url ? [site.social_image_url] : undefined,
      url: appUrl ? `${appUrl}/w/${site.slug}` : undefined,
    },
    alternates: {
      canonical: appUrl ? `${appUrl}/w/${site.slug}` : undefined,
    },
  };
}

export default async function PublicWeddingSitePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_wedding_site", { p_slug: slug });
  const site = data as PublicSite | null;

  if (!site) {
    return (
      <main className="min-h-[100svh] px-6 py-16">
        <h1 className="font-heading text-3xl">Site indisponibil</h1>
      </main>
    );
  }

  if (site.password_protected) {
    const cookieStore = await cookies();
    const unlocked = cookieStore.get(`ew_site_${slug}`)?.value === "1";
    if (!unlocked) {
      return (
        <main className="min-h-[100svh] px-6 py-16">
          <h1 className="font-heading text-3xl">Site protejat</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Introdu parola din invitație (formular simplu în setări cuplu).
          </p>
          <form action={`/w/${slug}/unlock`} method="post" className="mt-6 max-w-sm space-y-3">
            <input
              name="password"
              type="password"
              required
              className="h-9 w-full rounded-lg border border-input px-3 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Intră
            </button>
          </form>
        </main>
      );
    }
  }

  if (site.analytics_enabled) {
    const headerStore = await headers();
    const ua = headerStore.get("user-agent");
    const referer = headerStore.get("referer");
    let referrerDomain: string | null = null;
    try {
      if (referer) referrerDomain = new URL(referer).hostname;
    } catch {
      referrerDomain = null;
    }
    const cookieStore = await cookies();
    const existing = cookieStore.get("ew_visit_sid")?.value;
    const session =
      existing ||
      createHash("sha256")
        .update(`${slug}:${ua ?? "ua"}:${headerStore.get("x-forwarded-for") ?? "x"}`)
        .digest("hex")
        .slice(0, 32);
    await supabase.rpc("record_site_visit", {
      p_slug: slug,
      p_visitor_session_id: session,
      p_page_path: "/",
      p_referrer_domain: referrerDomain,
      p_device_type: deviceClassFromUa(ua),
    });
  }

  const theme: SiteThemeConfig = siteThemeSchema.safeParse(site.theme_config).success
    ? siteThemeSchema.parse(site.theme_config)
    : defaultSiteTheme();

  return (
    <main>
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
