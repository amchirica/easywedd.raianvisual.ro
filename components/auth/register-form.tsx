"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  registerAction,
  type SignupResult,
} from "@/lib/actions/auth";
import { passwordStrengthChecks } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

type RegisterFormProps = {
  nextPath?: string;
  claimToken?: string;
};

const initialState: SignupResult = {
  success: false,
  message: "",
};

export function RegisterForm({ nextPath, claimToken }: RegisterFormProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const { auth, common } = dict;
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  const checks = useMemo(() => passwordStrengthChecks(password), [password]);
  const allStrong =
    checks.minLength && checks.uppercase && checks.lowercase && checks.number;

  useEffect(() => {
    if (!state.success) return;
    if (state.requiresEmailConfirmation) {
      try {
        sessionStorage.setItem("ew_pending_signup_email", state.email);
      } catch {
        // ignore storage failures
      }
      router.push("/check-email");
      return;
    }
    router.push(state.redirectTo);
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {claimToken ? (
        <input type="hidden" name="claim" value={claimToken} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="full_name">{common.fullName}</Label>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          placeholder={auth.namePlaceholder}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{common.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={auth.emailPlaceholder}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{common.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={auth.passwordPlaceholder}
          disabled={pending}
          aria-describedby="register-password-rules"
        />
        <ul
          id="register-password-rules"
          className="space-y-1 text-xs text-muted-foreground"
        >
          <li className={cn(checks.minLength && "text-foreground")}>
            {checks.minLength ? "✓" : "○"} {auth.passwordRuleMin}
          </li>
          <li className={cn(checks.uppercase && "text-foreground")}>
            {checks.uppercase ? "✓" : "○"} {auth.passwordRuleUpper}
          </li>
          <li className={cn(checks.lowercase && "text-foreground")}>
            {checks.lowercase ? "✓" : "○"} {auth.passwordRuleLower}
          </li>
          <li className={cn(checks.number && "text-foreground")}>
            {checks.number ? "✓" : "○"} {auth.passwordRuleNumber}
          </li>
        </ul>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="accept_terms"
            required
            disabled={pending}
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>
            {auth.acceptTerms}{" "}
            <Link href="/terms" className="underline underline-offset-4">
              {auth.termsLink}
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="accept_privacy"
            required
            disabled={pending}
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>
            {auth.acceptPrivacy}{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              {auth.privacyLink}
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="marketing"
            disabled={pending}
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>{auth.marketingOptIn}</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="analytics"
            disabled={pending}
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>{auth.analyticsOptIn}</span>
        </label>
      </div>

      {!state.success && state.message ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !allStrong}
      >
        {pending ? auth.processing : auth.submitRegister}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {auth.checkEmailBody}
      </p>

      <p className="text-center text-sm text-muted-foreground">
        {auth.hasAccount}{" "}
        <Link
          href={
            nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"
          }
          className="text-foreground underline underline-offset-4"
        >
          {auth.loginLink}
        </Link>
      </p>
    </form>
  );
}
