"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

export function PrintButton({ label }: { label?: string }) {
  const { dict } = useI18n();
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      {label ?? dict.common.exportPdfPrint}
    </Button>
  );
}
