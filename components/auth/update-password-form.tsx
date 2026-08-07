"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updatePasswordAction,
  type SettingsActionResult,
} from "@/lib/actions/settings";
import { translateErrorCode } from "@/lib/i18n/errors";

export function UpdatePasswordForm() {
  const router = useRouter();
  const { dict, locale } = useI18n();
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    {} as SettingsActionResult,
  );

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/settings");
    }
  }, [state.success, router]);

  const errorMessage = state.errorCode
    ? translateErrorCode(state.errorCode, locale, state.error)
    : state.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="password">{dict.auth.newPassword}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm_password">{dict.auth.confirmPassword}</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.common.saving : dict.auth.updatePassword}
      </Button>
    </form>
  );
}
