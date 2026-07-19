"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updatePasswordAction,
  type SettingsActionResult,
} from "@/lib/actions/settings";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    {} as SettingsActionResult,
  );

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/settings");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="password">Parolă nouă</Label>
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
        <Label htmlFor="confirm_password">Confirmă parola</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Se salvează..." : "Actualizează parola"}
      </Button>
    </form>
  );
}
