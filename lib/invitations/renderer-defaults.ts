import {
  contentConfigSchema,
  defaultContent,
  defaultTheme,
  themeConfigSchema,
} from "@/lib/invitations/schema";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

export function parseThemeConfig(value: unknown): InvitationThemeConfig {
  const parsed = themeConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultTheme();
}

export function parseContentConfig(value: unknown): InvitationContentConfig {
  const parsed = contentConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultContent();
}

export { defaultContent, defaultTheme };
