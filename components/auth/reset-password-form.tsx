"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordAction,
  type ActionResult,
} from "@/lib/actions/auth";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/callback-destination";
import { translateValidationMessage } from "@/lib/i18n/errors";
import { passwordStrengthChecks } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const router = useRouter();
  const { dict, locale } = useI18n();
  const { auth } = dict;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    {} as ActionResult,
  );

  const checks = useMemo(() => passwordStrengthChecks(password), [password]);
  const allStrong =
    checks.minLength && checks.uppercase && checks.lowercase && checks.number;

  useEffect(() => {
    if (!state.success || !state.redirectTo) return;
    // Leave this page immediately so a post-signOut re-render cannot show
    // "Sesiune lipsă" after a successful password update.
    router.replace(state.redirectTo);
  }, [state.success, state.redirectTo, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">{auth.newPassword}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-20"
            aria-describedby="password-rules"
          />
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? auth.hidePasswordAria : auth.showPasswordAria
            }
          >
            {showPassword ? auth.hide : auth.show}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">{auth.confirmPassword}</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? "text" : "password"}
            required
            autoComplete="new-password"
            className="pr-20"
          />
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={
              showConfirm ? auth.hideConfirmAria : auth.showConfirmAria
            }
          >
            {showConfirm ? auth.hide : auth.show}
          </button>
        </div>
      </div>

      <ul
        id="password-rules"
        className="space-y-1 text-xs text-muted-foreground"
      >
        <Rule ok={checks.minLength}>{auth.passwordRuleMin}</Rule>
        <Rule ok={checks.uppercase}>{auth.passwordRuleUpper}</Rule>
        <Rule ok={checks.lowercase}>{auth.passwordRuleLower}</Rule>
        <Rule ok={checks.number}>{auth.passwordRuleNumber}</Rule>
      </ul>

      {state.error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {translateValidationMessage(state.error, locale)}
        </p>
      ) : null}

      {state.success ? (
        <p
          className="rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !allStrong || Boolean(state.success)}
      >
        {pending ? dict.common.saving : auth.saveNewPassword}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {auth.linkExpiredPrompt}{" "}
        <Link
          href={FORGOT_PASSWORD_PATH}
          className="text-foreground underline underline-offset-4"
        >
          {auth.requestNewLink}
        </Link>
      </p>
    </form>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn(ok ? "text-foreground" : "text-muted-foreground")}>
      {ok ? "✓" : "○"} {children}
    </li>
  );
}
