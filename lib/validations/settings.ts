import { z } from "zod";

export const profileSettingsSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Numele trebuie să aibă cel puțin 2 caractere")
    .max(120),
  locale: z.enum(["ro", "en"]).default("ro"),
  timezone: z
    .string()
    .trim()
    .min(1, "Selectează un fus orar")
    .max(80),
});

export const workspaceSettingsSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(2, "Numele workspace-ului trebuie să aibă cel puțin 2 caractere")
    .max(120),
});

export const notificationPreferencesSchema = z.object({
  transactional_enabled: z.boolean(),
  reminders_enabled: z.boolean(),
  marketing_enabled: z.boolean(),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Parola trebuie să aibă cel puțin 8 caractere"),
    confirm_password: z.string().min(8, "Confirmă parola"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Parolele nu coincid",
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
