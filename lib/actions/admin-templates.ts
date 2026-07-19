"use server";

import { revalidatePath } from "next/cache";

import { adminTemplateSchema } from "@/lib/validations/invitations";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/workspace";
import type { Json } from "@/types/database";

async function requireAdmin() {
  const ctx = await getCurrentUserContext();
  if (!ctx.user || !ctx.isPlatformAdmin) return null;
  return createClient();
}

export async function createAdminTemplateAction(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  if (!supabase) return;

  let template_schema: Json = {};
  try {
    template_schema = JSON.parse(String(formData.get("template_schema_json") || "{}"));
  } catch {
    return;
  }

  const parsed = adminTemplateSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    thumbnail_url: String(formData.get("thumbnail_url") || ""),
    is_premium: formData.get("is_premium") === "on",
    is_active: formData.get("is_active") === "on",
    template_schema_json: JSON.stringify(template_schema),
  });
  if (!parsed.success) return;

  await supabase.from("invitation_templates").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    category: parsed.data.category,
    thumbnail_url: parsed.data.thumbnail_url || null,
    is_premium: parsed.data.is_premium,
    is_active: parsed.data.is_active,
    template_schema,
  });

  revalidatePath("/admin/templates");
}

export async function updateAdminTemplateAction(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  let template_schema: Json = {};
  try {
    template_schema = JSON.parse(String(formData.get("template_schema_json") || "{}"));
  } catch {
    return;
  }

  const parsed = adminTemplateSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    thumbnail_url: String(formData.get("thumbnail_url") || ""),
    is_premium: formData.get("is_premium") === "on",
    is_active: formData.get("is_active") === "on",
    template_schema_json: JSON.stringify(template_schema),
  });
  if (!parsed.success) return;

  await supabase
    .from("invitation_templates")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      category: parsed.data.category,
      thumbnail_url: parsed.data.thumbnail_url || null,
      is_premium: parsed.data.is_premium,
      is_active: parsed.data.is_active,
      template_schema,
    })
    .eq("id", id);

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${id}`);
}

export async function duplicateAdminTemplateAction(templateId: string): Promise<void> {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const { data } = await supabase
    .from("invitation_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (!data) return;

  await supabase.from("invitation_templates").insert({
    name: `${data.name} (copie)`,
    slug: `${data.slug}-copy-${Date.now().toString(36)}`,
    category: data.category,
    thumbnail_url: data.thumbnail_url,
    template_schema: data.template_schema,
    is_premium: data.is_premium,
    is_active: false,
  });

  revalidatePath("/admin/templates");
}

export async function toggleAdminTemplateActiveAction(
  templateId: string,
  isActive: boolean,
): Promise<void> {
  const supabase = await requireAdmin();
  if (!supabase) return;

  await supabase
    .from("invitation_templates")
    .update({ is_active: isActive })
    .eq("id", templateId);

  revalidatePath("/admin/templates");
}
