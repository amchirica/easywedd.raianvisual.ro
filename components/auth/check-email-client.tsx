"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { resendConfirmationAction } from "@/lib/actions/auth";

type CheckEmailClientProps = {
  initialEmail: string | null;
};

const STORAGE_KEY = "ew_pending_signup_email";
const COOLDOWN_SEC = 60;

function readStoredEmail(fallback: string | null): string {
  if (fallback) return fallback;
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function CheckEmailClient({ initialEmail }: CheckEmailClientProps) {
  const { dict } = useI18n();
  const [email] = useState(() => readStoredEmail(initialEmail));
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SEC);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!initialEmail) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, initialEmail);
    } catch {
      // ignore
    }
  }, [initialEmail]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  function onResend() {
    if (secondsLeft > 0 || pending) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resendConfirmationAction(email || undefined);
      setSecondsLeft(COOLDOWN_SEC);
      if (result.ok) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{dict.auth.checkEmailTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.auth.checkEmailBody}
        </p>
      </div>

      {email ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{email}</span>
        </p>
      ) : null}

      {message ? (
        <p className="rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={pending || secondsLeft > 0}
          onClick={onResend}
          className="sm:flex-1"
        >
          {pending
            ? dict.auth.sending
            : secondsLeft > 0
              ? dict.auth.resendIn.replace("{n}", String(secondsLeft))
              : dict.auth.resendConfirmation}
        </Button>
        <Link
          href="/login"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground sm:flex-1"
        >
          {dict.auth.loginLink}
        </Link>
      </div>
    </div>
  );
}
