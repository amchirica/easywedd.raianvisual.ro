"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

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
        <Label htmlFor="full_name">Nume complet</Label>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          placeholder="Ana Popescu"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Parolă</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minim 8 caractere, literă mare + cifră"
          disabled={pending}
          aria-describedby="register-password-rules"
        />
        <ul
          id="register-password-rules"
          className="space-y-1 text-xs text-muted-foreground"
        >
          <li className={cn(checks.minLength && "text-foreground")}>
            {checks.minLength ? "✓" : "○"} Minim 8 caractere
          </li>
          <li className={cn(checks.uppercase && "text-foreground")}>
            {checks.uppercase ? "✓" : "○"} Cel puțin o literă mare
          </li>
          <li className={cn(checks.lowercase && "text-foreground")}>
            {checks.lowercase ? "✓" : "○"} Cel puțin o literă mică
          </li>
          <li className={cn(checks.number && "text-foreground")}>
            {checks.number ? "✓" : "○"} Cel puțin o cifră
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
            Accept{" "}
            <Link href="/terms" className="underline underline-offset-4">
              Termenii și condițiile
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
            Accept{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Politica de confidențialitate
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
          <span>Vreau să primesc noutăți și oferte (opțional)</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="analytics"
            disabled={pending}
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>
            Permite analytics pentru îmbunătățirea produsului (opțional)
          </span>
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
        {pending ? "Se creează contul…" : "Creează cont"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ai deja cont?{" "}
        <Link
          href={
            nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"
          }
          className="text-foreground underline underline-offset-4"
        >
          Autentifică-te
        </Link>
      </p>
    </form>
  );
}
