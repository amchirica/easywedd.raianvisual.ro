"use client";

import Link from "next/link";
import { useActionState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/actions/auth";
import { translateValidationMessage } from "@/lib/i18n/errors";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "register" | "forgot";
  action: (
    prev: ActionResult,
    formData: FormData,
  ) => Promise<ActionResult>;
  nextPath?: string;
  claimToken?: string;
};

export function AuthForm({ mode, action, nextPath, claimToken }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const { dict, locale } = useI18n();
  const { auth, common } = dict;
  const errorMessage = state.error
    ? translateValidationMessage(state.error, locale)
    : null;

  const submitLabel =
    mode === "login"
      ? auth.submitLogin
      : mode === "register"
        ? auth.submitRegister
        : auth.submitForgot;

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {claimToken ? (
        <input type="hidden" name="claim" value={claimToken} />
      ) : null}

      {mode === "register" ? (
        <div className="space-y-2">
          <Label htmlFor="full_name">{common.fullName}</Label>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            required
            placeholder={auth.namePlaceholder}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{common.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={auth.emailPlaceholder}
        />
      </div>

      {mode !== "forgot" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{common.password}</Label>
            {mode === "login" ? (
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {auth.forgotPassword}
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
            placeholder={auth.passwordPlaceholder}
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
              className="mt-1 size-4 accent-[var(--champagne)]"
            />
            <span>{auth.marketingOptIn}</span>
          </label>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="analytics"
              className="mt-1 size-4 accent-[var(--champagne)]"
            />
            <span>{auth.analyticsOptIn}</span>
          </label>
        </div>
      ) : null}

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
        {pending ? auth.processing : submitLabel}
      </Button>

      <p
        className={cn(
          "text-center text-sm text-muted-foreground",
          mode === "forgot" && "pt-1",
        )}
      >
        {mode === "login" ? (
          <>
            {auth.noAccount}{" "}
            <Link
              href={
                nextPath
                  ? `/register?next=${encodeURIComponent(nextPath)}`
                  : "/register"
              }
              className="text-foreground underline underline-offset-4"
            >
              {auth.registerLink}
            </Link>
          </>
        ) : mode === "register" ? (
          <>
            {auth.hasAccount}{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              {auth.loginLink}
            </Link>
          </>
        ) : (
          <Link href="/login" className="text-foreground underline underline-offset-4">
            {auth.loginLink}
          </Link>
        )}
      </p>
    </form>
  );
}
