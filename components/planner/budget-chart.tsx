"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/i18n/format";

type BudgetChartProps = {
  data: { categoryName: string; estimated: number; paid: number }[];
};

export function BudgetChart({ data }: BudgetChartProps) {
  const { dict, locale } = useI18n();
  const max = Math.max(...data.map((d) => d.estimated), 1);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {dict.budget.noCategoryData}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div key={row.categoryName}>
          <div className="mb-1 flex justify-between text-xs">
            <span>{row.categoryName}</span>
            <span className="text-muted-foreground">
              {formatNumber(row.paid, locale)} /{" "}
              {formatNumber(row.estimated, locale)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-champagne"
              style={{ width: `${Math.min((row.estimated / max) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
