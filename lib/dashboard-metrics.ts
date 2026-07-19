import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

import type { Wedding } from "@/types/database";

export function getCountdownLabel(weddingDate: string | null | undefined) {
  if (!weddingDate) {
    return {
      value: "—",
      hint: "Setează data nunții pentru countdown",
    };
  }

  const date = parseISO(weddingDate);
  const days = differenceInCalendarDays(date, new Date());

  if (days > 0) {
    return {
      value: `${days}`,
      hint: `zile până pe ${format(date, "d MMMM yyyy", { locale: ro })}`,
    };
  }

  if (days === 0) {
    return { value: "0", hint: "Nunta este astăzi" };
  }

  return {
    value: "0",
    hint: `Nunta a avut loc pe ${format(date, "d MMMM yyyy", { locale: ro })}`,
  };
}

export function getWeddingTitle(wedding: Wedding | null) {
  if (!wedding?.couple_name_1 && !wedding?.couple_name_2) {
    return "Nunta ta";
  }
  return `${wedding.couple_name_1 ?? ""} & ${wedding.couple_name_2 ?? ""}`.trim();
}
