"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

type CsvDownloadButtonProps = {
  filename: string;
  action: () => Promise<{ csv?: string; error?: string }>;
  label?: string;
};

export function CsvDownloadButton({
  filename,
  action,
  label = "Export CSV",
}: CsvDownloadButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (!result.csv) {
            window.alert(result.error ?? "Export eșuat");
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
      {pending ? "Se exportă..." : label}
    </Button>
  );
}
