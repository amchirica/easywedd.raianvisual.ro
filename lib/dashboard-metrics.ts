import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { enUS, ro } from "date-fns/locale";

import type { Locale } from "@/lib/i18n/config";
import { safeLocale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { t } from "@/lib/i18n/t";
import type { Wedding } from "@/types/database";

function dateFnsLocale(locale: Locale) {
  return locale === "en" ? enUS : ro;
}

export function getCountdownLabel(
  weddingDate: string | null | undefined,
  locale?: Locale | string | null,
) {
  const loc = safeLocale(locale);
  const dict = getDictionarySync(loc);
  const dfLocale = dateFnsLocale(loc);

  if (!weddingDate) {
    return {
      value: "—",
      hint: dict.dashboard.noDate,
    };
  }

  const date = parseISO(weddingDate);
  const days = differenceInCalendarDays(date, new Date());
  const formatted = format(date, "d MMMM yyyy", { locale: dfLocale });

  if (days > 0) {
    return {
      value: `${days}`,
      hint: t(dict as never, "dashboard.daysUntilDate", {
        locale: loc,
        params: { date: formatted },
      }),
    };
  }

  if (days === 0) {
    return { value: "0", hint: dict.dashboard.weddingToday };
  }

  return {
    value: "0",
    hint: t(dict as never, "dashboard.weddingPast", {
      locale: loc,
      params: { date: formatted },
    }),
  };
}

export function getWeddingTitle(
  wedding: Wedding | null,
  locale?: Locale | string | null,
) {
  if (!wedding?.couple_name_1 && !wedding?.couple_name_2) {
    return getDictionarySync(safeLocale(locale)).wedding.yourWedding;
  }
  return `${wedding.couple_name_1 ?? ""} & ${wedding.couple_name_2 ?? ""}`.trim();
}
