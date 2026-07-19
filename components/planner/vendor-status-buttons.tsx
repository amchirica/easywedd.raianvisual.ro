"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { VendorStatus } from "@/types/planner";

const STATUSES: { value: VendorStatus; label: string }[] = [
  { value: "offered", label: "Ofertat" },
  { value: "contacted", label: "Contactat" },
  { value: "shortlist", label: "Shortlist" },
  { value: "contracted", label: "Contractat" },
  { value: "rejected", label: "Refuzat" },
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
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((status) => (
        <Button
          key={status.value}
          size="xs"
          variant={current === status.value ? "default" : "outline"}
          onClick={() =>
            startTransition(() => {
              void onChange(vendorId, status.value);
            })
          }
        >
          {status.label}
        </Button>
      ))}
    </div>
  );
}
