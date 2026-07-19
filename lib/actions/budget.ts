"use server";

import { revalidatePath } from "next/cache";

import { trackProductEvent } from "@/lib/analytics/product";
import { applyPaymentToItem } from "@/lib/planner/budget-math";
import { canManagePlanner } from "@/lib/planner/access";
import { logAudit, requireWeddingContext } from "@/lib/planner/context";
import { toCsv } from "@/lib/planner/exports";
import {
  budgetItemSchema,
  exchangeRateSchema,
  paymentSchema,
} from "@/lib/validations/budget";

export type ActionState = { error?: string; success?: string; csv?: string };

export async function createBudgetItemAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const parsed = budgetItemSchema.safeParse({
    name: formData.get("name"),
    category_id: String(formData.get("category_id") || "") || undefined,
    vendor_id: String(formData.get("vendor_id") || "") || undefined,
    estimated_amount: formData.get("estimated_amount") || 0,
    contracted_amount: formData.get("contracted_amount") || 0,
    currency: formData.get("currency") || "RON",
    notes: String(formData.get("notes") || "") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const contracted = parsed.data.contracted_amount;
  const { error } = await ctx.context.supabase.from("budget_items").insert({
    workspace_id: ctx.context.workspaceId,
    wedding_id: ctx.context.weddingId,
    name: parsed.data.name,
    category_id: parsed.data.category_id || null,
    vendor_id: parsed.data.vendor_id || null,
    estimated_amount: parsed.data.estimated_amount,
    contracted_amount: contracted,
    paid_amount: 0,
    due_amount: contracted,
    payment_status: contracted > 0 ? "unpaid" : "unpaid",
    currency: parsed.data.currency,
    notes: parsed.data.notes ?? null,
  });

  if (error) return;
  await trackProductEvent("budget_item_added", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: {},
  });
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
  return;
}

export async function addPaymentAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const parsed = paymentSchema.safeParse({
    budget_item_id: formData.get("budget_item_id"),
    amount: formData.get("amount"),
    payment_date: formData.get("payment_date"),
    payment_method: formData.get("payment_method") || "transfer",
    reference: String(formData.get("reference") || "") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, workspaceId } = ctx.context;
  const { error } = await supabase.from("payments").insert({
    workspace_id: workspaceId,
    budget_item_id: parsed.data.budget_item_id,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    payment_method: parsed.data.payment_method,
    reference: parsed.data.reference ?? null,
  });

  if (error) return;

  const { data: item } = await supabase
    .from("budget_items")
    .select("*")
    .eq("id", parsed.data.budget_item_id)
    .maybeSingle();

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("budget_item_id", parsed.data.budget_item_id);

  if (item && payments) {
    const next = applyPaymentToItem(item, payments);
    await supabase.from("budget_items").update(next).eq("id", item.id);
  }

  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
  return;
}

export async function saveExchangeRateAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const parsed = exchangeRateSchema.safeParse({
    base_currency: formData.get("base_currency"),
    quote_currency: formData.get("quote_currency"),
    rate: formData.get("rate"),
    effective_on: formData.get("effective_on"),
  });

  if (!parsed.success) {
    return;
  }

  if (parsed.data.base_currency === parsed.data.quote_currency) {
    return;
  }

  const { error } = await ctx.context.supabase.from("exchange_rates").upsert(
    {
      workspace_id: ctx.context.workspaceId,
      base_currency: parsed.data.base_currency,
      quote_currency: parsed.data.quote_currency,
      rate: parsed.data.rate,
      effective_on: parsed.data.effective_on,
    },
    { onConflict: "workspace_id,base_currency,quote_currency,effective_on" },
  );

  if (error) return;
  revalidatePath("/dashboard/budget");
  return;
}

export async function seedBudgetCategoriesAction(): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase.rpc("seed_default_budget_categories", {
    p_workspace_id: ctx.context.workspaceId,
    p_wedding_id: ctx.context.weddingId,
  });

  revalidatePath("/dashboard/budget");
}

export async function exportBudgetCsvAction(): Promise<ActionState> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return { error: ctx.error ?? "Eroare" };

  const { data: items } = await ctx.context.supabase
    .from("budget_items")
    .select("*")
    .eq("wedding_id", ctx.context.weddingId)
    .order("created_at");

  const csv = toCsv(
    (items ?? []).map((item) => ({
      name: item.name,
      estimated: item.estimated_amount,
      contracted: item.contracted_amount,
      paid: item.paid_amount,
      due: item.due_amount,
      status: item.payment_status,
      currency: item.currency,
    })),
  );

  await logAudit(
    ctx.context.workspaceId,
    ctx.context.user!.id,
    "export.csv",
    "budget",
    null,
    { rows: items?.length ?? 0 },
  );

  return { success: "Export generat.", csv };
}

export async function deleteBudgetItemAction(id: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase
    .from("budget_items")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/budget");
}
