"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";

type AuthAutoRedirectProps = {
  href: string;
  seconds?: number;
};

export function AuthAutoRedirect({
  href,
  seconds = 3,
}: AuthAutoRedirectProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      router.replace(href);
      return;
    }
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, href, router]);

  return (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      {dict.auth.autoRedirect.replace("{n}", String(left))}
    </p>
  );
}
