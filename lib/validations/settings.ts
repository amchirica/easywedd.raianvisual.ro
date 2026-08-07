import { z } from "zod";

export const profileSettingsSchema = z.object({
  full_name: z.string().trim().min(2, "validation.nameMin").max(120),
  locale: z.enum(["ro", "en"]).default("ro"),
  timezone: z.string().trim().min(1, "validation.timezoneRequired").max(80),
});

export const workspaceSettingsSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(2, "validation.workspaceNameMin").max(120),
});

export const notificationPreferencesSchema = z.object({
  transactional_enabled: z.boolean(),
  reminders_enabled: z.boolean(),
  marketing_enabled: z.boolean(),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "validation.passwordMin"),
    confirm_password: z.string().min(8, "validation.confirmPassword"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "validation.passwordMismatch",
    path: ["confirm_password"],
  });

export const LOCALE_OPTIONS = [
  { value: "ro", label: "Română" },
  { value: "en", label: "English" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Europe/Bucharest", label: "Europe/Bucharest (România)" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "UTC", label: "UTC" },
] as const;
