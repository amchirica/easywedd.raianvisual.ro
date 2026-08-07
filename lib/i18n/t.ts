import type { Locale } from "@/lib/i18n/config";

export type DictValue = string | number | boolean | null | DictNode | DictValue[];
export type DictNode = { readonly [key: string]: DictValue };

/**
 * Resolve a dotted path in a dictionary tree.
 * Dev: missing keys → `[i18n missing: path]`
 * Prod: optional fallbackDict (usually RO), else the path string.
 */
export function t(
  dict: DictNode,
  path: string,
  options?: {
    locale?: Locale;
    fallbackDict?: DictNode;
    params?: Record<string, string | number>;
  },
): string {
  const resolved =
    getPath(dict, path) ??
    (options?.fallbackDict ? getPath(options.fallbackDict, path) : undefined);

  let text: string;
  if (typeof resolved === "string") {
    text = resolved;
  } else if (process.env.NODE_ENV !== "production") {
    text = `[i18n missing: ${path}]`;
  } else {
    text = path;
  }

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      text = text.replaceAll(`{${key}}`, String(value));
    }
  }
  return text;
}

function getPath(node: DictNode, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = node;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function flattenKeys(
  obj: DictNode,
  prefix = "",
): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as DictNode, next));
    } else if (Array.isArray(value)) {
      // Arrays of strings/objects: index leaf paths for parity
      value.forEach((item, index) => {
        if (item !== null && typeof item === "object") {
          keys.push(...flattenKeys(item as DictNode, `${next}.${index}`));
        } else {
          keys.push(`${next}.${index}`);
        }
      });
    } else {
      keys.push(next);
    }
  }
  return keys.sort();
}
