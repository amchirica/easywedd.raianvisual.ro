"use client";

import { useI18n } from "@/components/providers/i18n-provider";

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  const { dict } = useI18n();
  return (
    <div className="border border-dashed border-border bg-card/60 p-8 sm:p-10">
      <h1 className="font-heading text-3xl">{title}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>
      <p className="mt-6 text-sm text-champagne">{dict.dashboard.comingSoon}</p>
    </div>
  );
}
