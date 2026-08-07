"use client";

import { useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import type { VendorStatus } from "@/types/planner";

const STATUSES: VendorStatus[] = [
  "offered",
  "contacted",
  "shortlist",
  "contracted",
  "rejected",
];

type VendorStatusButtonsProps = {
  vendorId: string;
  current: VendorStatus;
  onChange: (vendorId: string, status: VendorStatus) => Promise<void>;
};

export function VendorStatusButtons({
  vendorId,
  current,
  onChange,
}: VendorStatusButtonsProps) {
  const { locale } = useI18n();
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((status) => (
        <Button
          key={status}
          size="xs"
          variant={current === status ? "default" : "outline"}
          onClick={() =>
            startTransition(() => {
              void onChange(vendorId, status);
            })
          }
        >
          {getStatusLabel("vendor", status, locale)}
        </Button>
      ))}
    </div>
  );
}
