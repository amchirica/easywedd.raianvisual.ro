"use client";

import { useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

type CsvDownloadButtonProps = {
  filename: string;
  action: () => Promise<{ csv?: string; error?: string }>;
  label?: string;
};

export function CsvDownloadButton({
  filename,
  action,
  label,
}: CsvDownloadButtonProps) {
  const { dict } = useI18n();
  const [pending, startTransition] = useTransition();
  const resolvedLabel = label ?? dict.common.exportCsv;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (!result.csv) {
            window.alert(result.error ?? dict.common.exportFailed);
            return;
          }
          const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        })
      }
    >
      {pending ? dict.common.exporting : resolvedLabel}
    </Button>
  );
}
