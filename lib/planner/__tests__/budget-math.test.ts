import { describe, expect, it } from "vitest";

import {
  applyPaymentToItem,
  derivePaymentStatus,
  organizationProgress,
  sumBudgetItems,
  totalsByCategory,
} from "@/lib/planner/budget-math";

describe("sumBudgetItems", () => {
  it("calculează totalurile și diferența estimat vs contractat", () => {
    const totals = sumBudgetItems([
      {
        estimated_amount: 1000,
        contracted_amount: 1200,
        paid_amount: 400,
        due_amount: 800,
      },
      {
        estimated_amount: 500,
        contracted_amount: 0,
        paid_amount: 100,
        due_amount: 0,
      },
    ]);

    expect(totals.estimated).toBe(1500);
    expect(totals.contracted).toBe(1200);
    expect(totals.paid).toBe(500);
    expect(totals.remaining).toBe(700);
    expect(totals.varianceEstimatedVsContracted).toBe(-300);
  });
});

describe("derivePaymentStatus", () => {
  it("returnează paid / partial / unpaid / overdue", () => {
    expect(derivePaymentStatus(1000, 1000)).toBe("paid");
    expect(derivePaymentStatus(1000, 200)).toBe("partial");
    expect(derivePaymentStatus(1000, 0)).toBe("unpaid");
    expect(derivePaymentStatus(1000, 0, "2000-01-01")).toBe("overdue");
  });
});

describe("applyPaymentToItem", () => {
  it("recalculează paid/due din plăți", () => {
    const next = applyPaymentToItem(
      { contracted_amount: 1000, paid_amount: 0, due_amount: 1000 },
      [{ amount: 250 }, { amount: 250 }],
    );
    expect(next.paid_amount).toBe(500);
    expect(next.due_amount).toBe(500);
    expect(next.payment_status).toBe("partial");
  });
});

describe("totalsByCategory", () => {
  it("grupează pe categorie", () => {
    const rows = totalsByCategory([
      {
        category_id: "a",
        category_name: "Catering",
        estimated_amount: 100,
        contracted_amount: 100,
        paid_amount: 40,
      },
      {
        category_id: "a",
        category_name: "Catering",
        estimated_amount: 50,
        contracted_amount: 50,
        paid_amount: 10,
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.estimated).toBe(150);
    expect(rows[0]?.paid).toBe(50);
  });
});

describe("organizationProgress", () => {
  it("calculează procentul mediu pe dimensiuni active", () => {
    expect(
      organizationProgress({
        totalTasks: 10,
        doneTasks: 5,
        totalGuests: 10,
        confirmedGuests: 10,
        totalVendors: 0,
        contractedVendors: 0,
      }),
    ).toBe(75);
  });

  it("returnează 0 fără date", () => {
    expect(
      organizationProgress({
        totalTasks: 0,
        doneTasks: 0,
        totalGuests: 0,
        confirmedGuests: 0,
        totalVendors: 0,
        contractedVendors: 0,
      }),
    ).toBe(0);
  });
});
