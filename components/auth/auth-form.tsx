"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "register" | "forgot";
  action: (
    prev: ActionResult,
    formData: FormData,
  ) => Promise<ActionResult>;
  nextPath?: string;
};

export function AuthForm({ mode, action, nextPath }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      {mode === "register" ? (
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
      ) : null}

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

      {mode !== "forgot" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Parolă</Label>
            {mode === "login" ? (
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Ai uitat parola?
              </Link>
            ) : null}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            placeholder="Minimum 8 caractere"
          />
        </div>
      ) : null}

      {mode === "register" ? (
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
            <span>Permite analytics pentru îmbunătățirea produsului (opțional)</span>
          </label>
        </div>
      ) : null}

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
        {pending
          ? "Se procesează..."
          : mode === "login"
            ? "Autentificare"
            : mode === "register"
              ? "Creează cont"
              : "Trimite link de resetare"}
      </Button>

      <p
        className={cn(
          "text-center text-sm text-muted-foreground",
          mode === "forgot" && "pt-1",
        )}
      >
        {mode === "login" ? (
          <>
            Nu ai cont?{" "}
            <Link
              href={
                nextPath
                  ? `/register?next=${encodeURIComponent(nextPath)}`
                  : "/register"
              }
              className="text-foreground underline underline-offset-4"
            >
              Înregistrează-te
            </Link>
          </>
        ) : mode === "register" ? (
          <>
            Ai deja cont?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Autentifică-te
            </Link>
          </>
        ) : (
          <>
            Înapoi la{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              autentificare
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
