import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Introdu un email valid"),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  email: z.email("Introdu un email valid"),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere"),
  accept_terms: z.literal(true, {
    error: "Trebuie să accepți Termenii și condițiile",
  }),
  accept_privacy: z.literal(true, {
    error: "Trebuie să accepți Politica de confidențialitate",
  }),
  marketing: z.boolean().default(false),
  analytics: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Introdu un email valid"),
});

export const resendConfirmationSchema = z.object({
  email: z.email("Introdu un email valid"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;
