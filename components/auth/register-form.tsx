"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  registerAction,
  type SignupResult,
} from "@/lib/actions/auth";

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
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

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
          placeholder="Minimum 8 caractere"
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="accept_terms"
            required
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
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>Vreau să primesc noutăți și oferte (opțional)</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="analytics"
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>
            Permite analytics pentru îmbunătățirea produsului (opțional)
          </span>
        </label>
      </div>

      {!state.success && state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Se procesează..." : "Creează cont"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ai deja cont?{" "}
        <Link
          href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          className="text-foreground underline underline-offset-4"
        >
          Autentifică-te
        </Link>
      </p>
    </form>
  );
}
