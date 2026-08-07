"use server";

import { revalidatePath } from "next/cache";

import { trackProductEvent } from "@/lib/analytics/product";
import { requireFeature } from "@/lib/entitlements/service";
import type { ErrorCode } from "@/lib/i18n/errors";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { vendorSchema } from "@/lib/validations/vendors";
import { isVendorCategorySlug } from "@/lib/vendors/categories";
import type { VendorStatus } from "@/types/planner";

export type ActionState = {
  error?: string;
  errorCode?: ErrorCode;
  success?: string;
};

export async function createVendorAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const feature = await requireFeature(ctx.context.workspaceId, "vendors");
  if (!feature.ok) return;

  const categoryRaw = String(formData.get("category") || "other");
  if (!isVendorCategorySlug(categoryRaw)) {
    return;
  }

  const parsed = vendorSchema.safeParse({
    company_name: formData.get("company_name"),
    category: categoryRaw,
    contact_name: String(formData.get("contact_name") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    website: String(formData.get("website") || "") || undefined,
    quoted_price: formData.get("quoted_price") || undefined,
    contracted_price: formData.get("contracted_price") || undefined,
    status: formData.get("status") || "offered",
    notes: String(formData.get("notes") || "") || undefined,
    due_date: String(formData.get("due_date") || "") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const { error } = await ctx.context.supabase.from("vendors").insert({
    workspace_id: ctx.context.workspaceId,
    wedding_id: ctx.context.weddingId,
    company_name: parsed.data.company_name,
    category: parsed.data.category,
    contact_name: parsed.data.contact_name ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email || null,
    website: parsed.data.website ?? null,
    quoted_price: parsed.data.quoted_price ?? null,
    contracted_price: parsed.data.contracted_price ?? null,
    status: parsed.data.status,
    notes: parsed.data.notes ?? null,
    due_date: parsed.data.due_date || null,
  });

  if (error) return;
  await trackProductEvent("vendor_added", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { category: parsed.data.category },
  });
  revalidatePath("/dashboard/vendors");
  return;
}

export async function updateVendorStatusAction(
  vendorId: string,
  status: VendorStatus,
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase
    .from("vendors")
    .update({ status })
    .eq("id", vendorId)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/vendors");
}

export async function deleteVendorAction(vendorId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase
    .from("vendors")
    .delete()
    .eq("id", vendorId)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/vendors");
}

export async function addVendorDocumentAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const vendorId = String(formData.get("vendor_id") || "");
  const title = String(formData.get("title") || "");
  const documentUrl = String(formData.get("document_url") || "");

  if (!vendorId || !title || !documentUrl) {
    return;
  }

  const { error } = await ctx.context.supabase.from("vendor_documents").insert({
    workspace_id: ctx.context.workspaceId,
    vendor_id: vendorId,
    title,
    document_url: documentUrl,
    document_type: String(formData.get("document_type") || "") || null,
  });

  if (error) return;
  revalidatePath("/dashboard/vendors");
  return;
}
