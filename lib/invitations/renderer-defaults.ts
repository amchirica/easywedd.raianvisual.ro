import {
  contentConfigSchema,
  defaultContent,
  defaultTheme,
  themeConfigSchema,
} from "@/lib/invitations/schema";
import { normalizeInvitationContent } from "@/lib/invitations/sections";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

export function parseThemeConfig(value: unknown): InvitationThemeConfig {
  const parsed = themeConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultTheme();
}

export function parseContentConfig(
  value: unknown,
  options?: {
    wedding?: {
      couple_name_1?: string | null;
      couple_name_2?: string | null;
      wedding_date?: string | null;
    } | null;
    templateSections?: string[] | null;
  },
): InvitationContentConfig {
  if (options?.templateSections || options?.wedding) {
    return normalizeInvitationContent(value, options);
  }
  const parsed = contentConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultContent();
}

export { defaultContent, defaultTheme };
