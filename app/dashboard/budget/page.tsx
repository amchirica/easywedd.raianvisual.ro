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
import { requireWeddingContext } from "@/lib/planner/context";

export const metadata: Metadata = { title: "Buget" };

export default async function BudgetPage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }
  if (!canAccessFeature(ctx.context.entitlements, "budget")) {
    return (
      <EmptyState
        title="Modul dezactivat"
        description="Entitlement-ul budget nu este activ."
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
          <h1 className="font-heading text-4xl">Budget Planner</h1>
          <p className="mt-2 text-muted-foreground">
            Monedă workspace: {currency}. Curs manual EUR/RON fără API extern.
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
                Categorii implicite
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Estimat", totals.estimated],
          ["Contractat", totals.contracted],
          ["Plătit", totals.paid],
          ["Rămas", totals.remaining],
        ].map(([label, value]) => (
          <article key={String(label)} className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-3xl">
              {formatMoney(Number(value), currency)}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-heading text-2xl">Pe categorii</h2>
          <div className="mt-4">
            <BudgetChart data={byCategory} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Diferență estimat vs contractat:{" "}
            {formatMoney(totals.varianceEstimatedVsContracted, currency)}
          </p>
        </article>

        {canWrite ? (
          <article className="border border-border bg-card p-4 print:hidden">
            <h2 className="font-heading text-2xl">Curs valutar</h2>
            <form action={saveExchangeRateAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Din</Label>
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
                <Label>În</Label>
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
                <Label>Curs</Label>
                <Input name="rate" type="number" step="0.0001" required />
              </div>
              <div className="space-y-1">
                <Label>Data</Label>
                <Input
                  name="effective_on"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <Button type="submit" className="sm:col-span-2">
                Salvează curs
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
            <Label>Nume</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label>Categorie</Label>
            <select
              name="category_id"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue=""
            >
              <option value="">Fără categorie</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Furnizor</Label>
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
            <Label>Estimat</Label>
            <Input name="estimated_amount" type="number" step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label>Contractat</Label>
            <Input name="contracted_amount" type="number" step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label>Monedă</Label>
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
            Adaugă linie
          </Button>
        </form>
      ) : null}

      {(items ?? []).length === 0 ? (
        <EmptyState
          title="Nicio linie de buget"
          description="Adaugă cheltuieli estimate și contractate."
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
                    Estimat {formatMoney(Number(item.estimated_amount), item.currency)} ·
                    Contractat {formatMoney(Number(item.contracted_amount), item.currency)} ·
                    Plătit {formatMoney(Number(item.paid_amount), item.currency)} ·
                    Rămas {formatMoney(Number(item.due_amount), item.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: {item.payment_status}
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
                  <Input name="amount" type="number" step="0.01" placeholder="Sumă" required />
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
                    <option value="transfer">Transfer</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="other">Altul</option>
                  </select>
                  <Button type="submit" variant="outline">
                    Adaugă plată
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
