"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { APP_NAME } from "@/lib/constants";

/**
 * Lightweight DOM mock for the hero — illustrative UI only.
 * Mirrors real EasyWedd modules without importing live dashboard code.
 */
export function HeroDashboardMock() {
  const { dict } = useI18n();
  const m = dict.mock;

  return (
    <div
      aria-hidden="true"
      className="surface-card glow-accent relative mx-auto w-full max-w-3xl overflow-hidden p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
          {APP_NAME}
        </p>
        <span className="shrink-0 rounded-full border border-champagne/30 bg-champagne/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-champagne-soft">
          {dict.common.demoUi}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <MockPanel title={m.daysLeft}>
          <p className="font-heading text-2xl text-champagne">142</p>
        </MockPanel>

        <MockPanel title={m.guests}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{m.confirmed}</span>
            <span className="font-medium text-champagne">86</span>
          </div>
        </MockPanel>

        <MockPanel title={m.budget}>
          <p className="text-xs font-medium text-foreground">42% {m.spent}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[42%] rounded-full bg-champagne" />
          </div>
        </MockPanel>

        <MockPanel title={m.tasks}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{m.done}</span>
            <span className="font-medium text-champagne">12</span>
          </div>
        </MockPanel>

        <MockPanel title={m.vendors}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{m.booked}</span>
            <span className="font-medium text-champagne">5</span>
          </div>
        </MockPanel>

        <MockPanel title={m.schedule}>
          {["14:00", "16:30", "19:00"].map((when) => (
            <div key={when} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 font-medium text-champagne">{when}</span>
              <span className="truncate text-muted-foreground">{m.schedule}</span>
            </div>
          ))}
        </MockPanel>
      </div>
    </div>
  );
}

function MockPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated/60 p-3">
      <p className="mb-2 text-[0.62rem] tracking-[0.12em] text-muted-foreground uppercase">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
