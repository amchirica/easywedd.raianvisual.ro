import type { SupportedCurrency } from "@/types/planner";

export type ExchangeRateRow = {
  base_currency: string;
  quote_currency: string;
  rate: number;
  effective_on: string;
};

export function convertAmount(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: ExchangeRateRow[],
  onDate: string = new Date().toISOString().slice(0, 10),
): number | null {
  if (from === to) return amount;

  const applicable = rates
    .filter(
      (r) =>
        r.base_currency === from &&
        r.quote_currency === to &&
        r.effective_on <= onDate,
    )
    .sort((a, b) => b.effective_on.localeCompare(a.effective_on));

  if (applicable[0]) {
    return amount * Number(applicable[0].rate);
  }

  const inverse = rates
    .filter(
      (r) =>
        r.base_currency === to &&
        r.quote_currency === from &&
        r.effective_on <= onDate,
    )
    .sort((a, b) => b.effective_on.localeCompare(a.effective_on));

  if (inverse[0] && Number(inverse[0].rate) !== 0) {
    return amount / Number(inverse[0].rate);
  }

  return null;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["RON", "EUR"];
