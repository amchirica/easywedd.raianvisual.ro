/**
 * Absolute URL for brand mark in emails (PNG only — never ICO).
 */
import { getSiteUrl } from "@/lib/url";

export function getBrandMarkUrl(size: "full" | 32 | 64 = "full"): string {
  const base = getSiteUrl();
  if (size === 32) return `${base}/brand/raian-mark-32.png`;
  if (size === 64) return `${base}/brand/raian-mark-64.png`;
  return `${base}/brand/raian-mark.png`;
}

export function brandMarkImgHtml(sizePx = 32): string {
  const src = getBrandMarkUrl(sizePx <= 32 ? 32 : sizePx <= 64 ? 64 : "full");
  return `<img src="${src}" width="${sizePx}" height="${sizePx}" alt="EasyWedd" style="display:block;width:${sizePx}px;height:${sizePx}px;object-fit:contain;border:0" />`;
}
