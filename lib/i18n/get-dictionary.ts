import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { ro } from "@/lib/i18n/dictionaries/ro";

export type Dictionary = typeof ro;

const dictionaries: Record<Locale, Dictionary> = {
  ro,
  en: en as unknown as Dictionary,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries.ro;
}

export function getDictionarySync(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ro;
}
