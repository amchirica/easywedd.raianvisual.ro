"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { trackProductEvent } from "@/lib/analytics/product";
import { sendTemplatedEmail } from "@/lib/emails/send";
import {
  assertWithinLimit,
  requireFeature,
} from "@/lib/entitlements/service";
import { canManagePlanner } from "@/lib/planner/access";
import { logAudit, requireWeddingContext } from "@/lib/planner/context";
import {
  defaultSectionConfig,
  defaultSiteTheme,
  sanitizeSectionConfig,
  siteThemeSchema,
} from "@/lib/website/schema";
import { isValidSiteSlug, slugifyCoupleNames } from "@/lib/website/slug";
import type { Json } from "@/types/database";
import type { WeddingSiteSectionType } from "@/types/website";

export async function createWeddingSiteAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const feature = await requireFeature(ctx.context.workspaceId, "website");
  if (!feature.ok) return;

  const templateId = String(formData.get("template_id") || "");
  const nameSlug = String(formData.get("slug") || "").trim().toLowerCase();

  const { count } = await ctx.context.supabase
    .from("wedding_sites")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ctx.context.workspaceId)
    .neq("status", "archived");

  if (!assertWithinLimit(feature.snapshot.rows, "wedding_limit", count ?? 0)) {
    return;
  }

  const { data: template } = await ctx.context.supabase
    .from("wedding_site_templates")
    .select("id, template_schema, is_premium")
    .eq("id", templateId)
    .eq("is_active", true)
    .maybeSingle();

  if (!template) return;
  if (template.is_premium) {
    const premium = await requireFeature(
      ctx.context.workspaceId,
      "premium_templates",
    );
    if (!premium.ok) return;
  }

  const schema = (template.template_schema ?? {}) as {
    sections?: WeddingSiteSectionType[];
    theme?: Record<string, string>;
  };

  const wedding = ctx.context.wedding;
  if (!wedding) return;

  let slug =
    nameSlug ||
    slugifyCoupleNames(wedding.couple_name_1 ?? "", wedding.couple_name_2 ?? "");
  if (!isValidSiteSlug(slug)) return;

  const { data: existing } = await ctx.context.supabase
    .from("wedding_sites")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const theme = siteThemeSchema.parse({
    ...defaultSiteTheme(),
    ...schema.theme,
  });

  const { data: site, error } = await ctx.context.supabase
    .from("wedding_sites")
    .insert({
      workspace_id: ctx.context.workspaceId,
      wedding_id: ctx.context.weddingId,
      slug,
      template_id: template.id,
      theme_config: theme as unknown as Json,
      seo_title: [wedding.couple_name_1, wedding.couple_name_2]
        .filter(Boolean)
        .join(" & "),
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !site) return;

  await ctx.context.supabase.from("wedding_site_pages").insert({
    wedding_site_id: site.id,
    page_type: "home",
    title: "Acasă",
    slug: "home",
    sort_order: 0,
  });

  const sectionTypes = schema.sections?.length
    ? schema.sections
    : (["hero", "story", "schedule", "locations", "rsvp", "contact"] as WeddingSiteSectionType[]);

  await ctx.context.supabase.from("wedding_site_sections").insert(
    sectionTypes.map((section_type, index) => ({
      wedding_site_id: site.id,
      section_type,
      section_config: sanitizeSectionConfig(
        defaultSectionConfig(section_type, wedding),
      ) as unknown as Json,
      sort_order: index,
      is_visible: true,
    })),
  );

  await trackProductEvent("wedding_site_created", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { template_id: template.id },
  });

  revalidatePath("/dashboard/website");
  redirect(`/dashboard/website/${site.id}/edit`);
}

export async function saveWeddingSiteSectionsAction(
  siteId: string,
  payload: {
    theme?: unknown;
    sections: {
      id: string;
      section_type: string;
      section_config: unknown;
      sort_order: number;
      is_visible: boolean;
    }[];
  },
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  if (payload.theme) {
    const theme = siteThemeSchema.parse(payload.theme);
    await ctx.context.supabase
      .from("wedding_sites")
      .update({ theme_config: theme as unknown as Json })
      .eq("id", siteId)
      .eq("workspace_id", ctx.context.workspaceId);
  }

  for (const section of payload.sections) {
    const parsed = sanitizeSectionConfig(
      (section.section_config ?? {}) as Parameters<typeof sanitizeSectionConfig>[0],
    );
    await ctx.context.supabase
      .from("wedding_site_sections")
      .update({
        section_config: parsed as unknown as Json,
        sort_order: section.sort_order,
        is_visible: section.is_visible,
      })
      .eq("id", section.id)
      .eq("wedding_site_id", siteId);
  }

  revalidatePath(`/dashboard/website/${siteId}`);
  revalidatePath(`/dashboard/website/${siteId}/edit`);
}

export async function publishWeddingSiteAction(siteId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const feature = await requireFeature(ctx.context.workspaceId, "website_publish");
  if (!feature.ok) return;

  const { data: site } = await ctx.context.supabase
    .from("wedding_sites")
    .select("*")
    .eq("id", siteId)
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();
  if (!site) return;

  const { data: sections } = await ctx.context.supabase
    .from("wedding_site_sections")
    .select("*")
    .eq("wedding_site_id", siteId);

  const { count } = await ctx.context.supabase
    .from("wedding_site_versions")
    .select("*", { count: "exact", head: true })
    .eq("wedding_site_id", siteId);

  await ctx.context.supabase.from("wedding_site_versions").insert({
    wedding_site_id: siteId,
    workspace_id: ctx.context.workspaceId,
    version_number: (count ?? 0) + 1,
    content_snapshot: {
      theme_config: site.theme_config,
      sections: sections ?? [],
    } as unknown as Json,
    created_by: ctx.context.user!.id,
  });

  await ctx.context.supabase
    .from("wedding_sites")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", siteId);

  await trackProductEvent("wedding_site_published", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { site_id: siteId },
  });

  await logAudit(
    ctx.context.workspaceId,
    ctx.context.user!.id,
    "website.publish",
    "wedding_site",
    siteId,
  );

  if (ctx.context.user?.email) {
    await sendTemplatedEmail("website_published", {
      to: ctx.context.user.email,
      userId: ctx.context.user.id,
      vars: { slug: site.slug },
    });
  }

  revalidatePath(`/dashboard/website/${siteId}`);
  revalidatePath(`/w/${site.slug}`);
}

export async function unpublishWeddingSiteAction(siteId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase
    .from("wedding_sites")
    .update({ status: "unpublished" })
    .eq("id", siteId)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath(`/dashboard/website/${siteId}`);
}

export async function updateWeddingSiteSettingsAction(
  formData: FormData,
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const siteId = String(formData.get("site_id") || "");
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase();
  if (!isValidSiteSlug(slug)) return;

  const password = String(formData.get("password") || "");
  const customDomain = String(formData.get("custom_domain") || "").trim();

  const update: DatabaseUpdate = {
    slug,
    seo_title: String(formData.get("seo_title") || "") || null,
    seo_description: String(formData.get("seo_description") || "") || null,
    social_image_url: String(formData.get("social_image_url") || "") || null,
    analytics_enabled: formData.get("analytics_enabled") === "on",
    password_protected: formData.get("password_protected") === "on",
    custom_domain: customDomain || null,
    domain_status: customDomain ? "pending" : "none",
  };

  if (password) {
    update.access_password_hash = createHash("sha256")
      .update(password)
      .digest("hex");
  }

  await ctx.context.supabase
    .from("wedding_sites")
    .update(update)
    .eq("id", siteId)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath(`/dashboard/website/${siteId}/settings`);
}

export async function duplicateWeddingSiteAction(siteId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const { data: site } = await ctx.context.supabase
    .from("wedding_sites")
    .select("*")
    .eq("id", siteId)
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();
  if (!site) return;

  const { data: sections } = await ctx.context.supabase
    .from("wedding_site_sections")
    .select("*")
    .eq("wedding_site_id", siteId);

  const newSlug = `${site.slug}-copie-${Date.now().toString(36).slice(-4)}`;
  const { data: created } = await ctx.context.supabase
    .from("wedding_sites")
    .insert({
      workspace_id: site.workspace_id,
      wedding_id: site.wedding_id,
      slug: newSlug,
      template_id: site.template_id,
      theme_config: site.theme_config,
      seo_title: site.seo_title,
      seo_description: site.seo_description,
      status: "draft",
    })
    .select("id")
    .single();

  if (!created) return;

  if (sections?.length) {
    await ctx.context.supabase.from("wedding_site_sections").insert(
      sections.map((s) => ({
        wedding_site_id: created.id,
        section_type: s.section_type,
        section_config: s.section_config,
        sort_order: s.sort_order,
        is_visible: s.is_visible,
      })),
    );
  }

  revalidatePath("/dashboard/website");
  redirect(`/dashboard/website/${created.id}/edit`);
}

type DatabaseUpdate = {
  slug?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  social_image_url?: string | null;
  analytics_enabled?: boolean;
  password_protected?: boolean;
  access_password_hash?: string;
  custom_domain?: string | null;
  domain_status?: "none" | "pending" | "verified" | "failed";
};
