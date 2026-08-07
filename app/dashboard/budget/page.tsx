import type { Metadata } from "next";

import { BudgetChart } from "@/components/planner/budget-chart";
import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { CsvDownloadButton } from "@/components/planner/csv-download-button";
import { EmptyState } from "@/components/planner/empty-state";
import { PrintButton } from "@/components/planner/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPaymentAction,
  createBudgetItemAction,
  deleteBudgetItemAction,
  exportBudgetCsvAction,
  saveExchangeRateAction,
  seedBudgetCategoriesAction,
} from "@/lib/actions/budget";
import { canAccessFeature, canManagePlanner } from "@/lib/planner/access";
import {
  formatMoney,
  sumBudgetItems,
  totalsByCategory,
} from "@/lib/planner/budget-math";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/t";
import { requireWeddingContext } from "@/lib/planner/context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.budget.title };
}

export default async function BudgetPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title={dict.shell.workspaceIncomplete} description={ctx.error ?? ""} />;
  }
  if (!canAccessFeature(ctx.context.entitlements, "budget")) {
    return (
      <EmptyState
        title={dict.shell.moduleDisabled}
        description={dict.shell.moduleDisabledDesc}
      />
    );
  }

  const canWrite = canManagePlanner(ctx.context.role);
  const currency = ctx.context.wedding?.currency ?? "RON";

  const [{ data: categories }, { data: items }, { data: rates }, { data: vendors }] =
    await Promise.all([
      ctx.context.supabase
        .from("budget_categories")
        .select("*")
        .eq("wedding_id", ctx.context.weddingId)
        .order("sort_order"),
      ctx.context.supabase
        .from("budget_items")
        .select("*")
        .eq("wedding_id", ctx.context.weddingId)
        .order("created_at"),
      ctx.context.supabase
        .from("exchange_rates")
        .select("*")
        .eq("workspace_id", ctx.context.workspaceId)
        .order("effective_on", { ascending: false }),
      ctx.context.supabase
        .from("vendors")
        .select("id, company_name")
        .eq("wedding_id", ctx.context.weddingId),
    ]);

  const totals = sumBudgetItems(items ?? []);
  const byCategory = totalsByCategory(
    (items ?? []).map((item) => ({
      ...item,
      category_name:
        categories?.find((c) => c.id === item.category_id)?.name ?? null,
    })),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">{dict.budget.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {t(dict as never, "budget.currencyHint", { locale, params: { currency } })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <CsvDownloadButton
            filename="buget-easywedd.csv"
            action={exportBudgetCsvAction}
          />
          <PrintButton />
          {canWrite ? (
            <form action={seedBudgetCategoriesAction}>
              <Button type="submit" variant="outline">
                {dict.budget.defaultCategories}
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [dict.budget.columns.estimated, totals.estimated],
          [dict.budget.columns.contracted, totals.contracted],
          [dict.budget.columns.paid, totals.paid],
          [dict.budget.columns.remaining, totals.remaining],
        ].map(([label, value]) => (
          <article key={String(label)} className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-3xl">
              {formatMoney(Number(value), currency, locale)}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-heading text-2xl">{dict.budget.byCategory}</h2>
          <div className="mt-4">
            <BudgetChart data={byCategory} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {dict.budget.varianceLabel}{" "}
            {formatMoney(totals.varianceEstimatedVsContracted, currency, locale)}
          </p>
        </article>

        {canWrite ? (
          <article className="border border-border bg-card p-4 print:hidden">
            <h2 className="font-heading text-2xl">{dict.budget.exchangeRateTitle}</h2>
            <form action={saveExchangeRateAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{dict.budget.from}</Label>
                <select
                  name="base_currency"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  defaultValue="EUR"
                >
                  <option value="EUR">EUR</option>
                  <option value="RON">RON</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{dict.budget.to}</Label>
                <select
                  name="quote_currency"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  defaultValue="RON"
                >
                  <option value="RON">RON</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{dict.budget.rate}</Label>
                <Input name="rate" type="number" step="0.0001" required />
              </div>
              <div className="space-y-1">
                <Label>{dict.budget.date}</Label>
                <Input
                  name="effective_on"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <Button type="submit" className="sm:col-span-2">
                {dict.budget.saveRate}
              </Button>
            </form>
            <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
              {(rates ?? []).slice(0, 5).map((rate) => (
                <li key={rate.id}>
                  1 {rate.base_currency} = {rate.rate} {rate.quote_currency} (
                  {rate.effective_on})
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>

      {canWrite ? (
        <form
          action={createBudgetItemAction}
          className="grid gap-3 border border-border bg-card p-4 print:hidden sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1">
            <Label>{dict.budget.name}</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label>{dict.budget.columns.category}</Label>
            <select
              name="category_id"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue=""
            >
              <option value="">{dict.budget.noCategory}</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{dict.budget.columns.vendor}</Label>
            <select
              name="vendor_id"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue=""
            >
              <option value="">—</option>
              {(vendors ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.company_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{dict.budget.columns.estimated}</Label>
            <Input name="estimated_amount" type="number" step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label>{dict.budget.columns.contracted}</Label>
            <Input name="contracted_amount" type="number" step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label>{dict.budget.currency}</Label>
            <select
              name="currency"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue={currency === "EUR" ? "EUR" : "RON"}
            >
              <option value="RON">RON</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <Button type="submit" className="sm:col-span-2 lg:col-span-3">
            {dict.budget.add}
          </Button>
        </form>
      ) : null}

      {(items ?? []).length === 0 ? (
        <EmptyState
          title={dict.budget.emptyTitle}
          description={dict.budget.emptyDescription}
        />
      ) : (
        <div className="space-y-3">
          {(items ?? []).map((item) => (
            <article
              key={item.id}
              className="border border-border bg-card p-4 print:break-inside-avoid"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dict.budget.columns.estimated} {formatMoney(Number(item.estimated_amount), item.currency, locale)} ·
                    {dict.budget.columns.contracted} {formatMoney(Number(item.contracted_amount), item.currency, locale)} ·
                    {dict.budget.columns.paid} {formatMoney(Number(item.paid_amount), item.currency, locale)} ·
                    {dict.budget.columns.remaining} {formatMoney(Number(item.due_amount), item.currency, locale)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dict.budget.paymentStatus}: {item.payment_status}
                  </p>
                </div>
                <div className="print:hidden">
                  <ConfirmDeleteButton
                    id={item.id}
                    action={deleteBudgetItemAction}
                  />
                </div>
              </div>
              {canWrite ? (
                <form
                  action={addPaymentAction}
                  className="mt-4 grid gap-2 border-t border-border pt-4 print:hidden sm:grid-cols-4"
                >
                  <input type="hidden" name="budget_item_id" value={item.id} />
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder={dict.budget.amountPlaceholder}
                    required
                  />
                  <Input
                    name="payment_date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                  <select
                    name="payment_method"
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                    defaultValue="transfer"
                  >
                    <option value="transfer">{dict.budget.paymentTransfer}</option>
                    <option value="card">{dict.budget.paymentCard}</option>
                    <option value="cash">{dict.budget.paymentCash}</option>
                    <option value="other">{dict.budget.paymentOther}</option>
                  </select>
                  <Button type="submit" variant="outline">
                    {dict.budget.addPayment}
                  </Button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
