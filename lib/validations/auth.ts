import { z } from "zod";

const emailSchema = z.email("validation.enterEmail");

/** Shared password policy for register + reset. */
export const strongPassword = z
  .string()
  .trim()
  .min(8, "validation.passwordMin")
  .regex(/[A-Z]/, "validation.passwordUpper")
  .regex(/[a-z]/, "validation.passwordLower")
  .regex(/[0-9]/, "validation.passwordDigit");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "validation.enterPassword"),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "validation.nameMin"),
  email: emailSchema,
  password: strongPassword,
  accept_terms: z.literal(true, {
    error: "validation.acceptTerms",
  }),
  accept_privacy: z.literal(true, {
    error: "validation.acceptPrivacy",
  }),
  marketing: z.boolean().default(false),
  analytics: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resendConfirmationSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: strongPassword,
    confirm_password: z.string().trim().min(1, "validation.confirmPassword"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "validation.passwordMismatch",
    path: ["confirm_password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function passwordStrengthChecks(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}
