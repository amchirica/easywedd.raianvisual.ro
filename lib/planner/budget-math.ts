import type { BudgetItem, Payment, PaymentStatus } from "@/types/planner";

export type BudgetTotals = {
  estimated: number;
  contracted: number;
  paid: number;
  due: number;
  remaining: number;
  varianceEstimatedVsContracted: number;
};

export function sumBudgetItems(items: Pick<
  BudgetItem,
  "estimated_amount" | "contracted_amount" | "paid_amount" | "due_amount"
>[]): BudgetTotals {
  const estimated = items.reduce((s, i) => s + Number(i.estimated_amount || 0), 0);
  const contracted = items.reduce(
    (s, i) => s + Number(i.contracted_amount || 0),
    0,
  );
  const paid = items.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const due = items.reduce((s, i) => s + Number(i.due_amount || 0), 0);
  const basis = contracted > 0 ? contracted : estimated;

  return {
    estimated,
    contracted,
    paid,
    due,
    remaining: Math.max(basis - paid, 0),
    varianceEstimatedVsContracted: contracted - estimated,
  };
}

export function totalsByCategory(
  items: (Pick<
    BudgetItem,
    "category_id" | "estimated_amount" | "contracted_amount" | "paid_amount"
  > & { category_name?: string | null })[],
): { categoryId: string | null; categoryName: string; estimated: number; paid: number }[] {
  const map = new Map<
    string,
    { categoryId: string | null; categoryName: string; estimated: number; paid: number }
  >();

  for (const item of items) {
    const key = item.category_id ?? "uncategorized";
    const current = map.get(key) ?? {
      categoryId: item.category_id,
      categoryName: item.category_name ?? "Fără categorie",
      estimated: 0,
      paid: 0,
    };
    current.estimated += Number(item.estimated_amount || 0);
    current.paid += Number(item.paid_amount || 0);
    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.estimated - a.estimated);
}

export function derivePaymentStatus(
  contracted: number,
  paid: number,
  dueDate?: string | null,
): PaymentStatus {
  if (paid <= 0) {
    if (dueDate && new Date(dueDate) < new Date()) return "overdue";
    return "unpaid";
  }
  if (contracted > 0 && paid >= contracted) return "paid";
  if (paid > 0 && contracted > 0 && paid < contracted) return "partial";
  if (paid > 0) return "partial";
  return "unpaid";
}

export function applyPaymentToItem(
  item: Pick<BudgetItem, "contracted_amount" | "paid_amount" | "due_amount">,
  payments: Pick<Payment, "amount">[],
): { paid_amount: number; due_amount: number; payment_status: PaymentStatus } {
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const contracted = Number(item.contracted_amount || 0);
  const due = Math.max(contracted - paid, 0);
  return {
    paid_amount: paid,
    due_amount: due,
    payment_status: derivePaymentStatus(contracted, paid),
  };
}

export function formatMoney(amount: number, currency = "RON") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function organizationProgress(input: {
  totalTasks: number;
  doneTasks: number;
  totalGuests: number;
  confirmedGuests: number;
  totalVendors: number;
  contractedVendors: number;
}): number {
  const weights = [
    input.totalTasks > 0 ? input.doneTasks / input.totalTasks : 0,
    input.totalGuests > 0 ? input.confirmedGuests / input.totalGuests : 0,
    input.totalVendors > 0 ? input.contractedVendors / input.totalVendors : 0,
  ];
  const active = [
    input.totalTasks > 0,
    input.totalGuests > 0,
    input.totalVendors > 0,
  ].filter(Boolean).length;

  if (active === 0) return 0;
  const sum = weights.reduce((a, b) => a + b, 0);
  return Math.round((sum / active) * 100);
}
