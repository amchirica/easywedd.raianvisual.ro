"use client";

import { useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

type ConfirmDeleteButtonProps = {
  label?: string;
  confirmLabel?: string;
  /** Serializable entity id — never pass a closure from a Server Component. */
  id: string;
  /** Server Action reference (or client-callable async fn with the same shape). */
  action: (id: string) => Promise<void>;
};

export function ConfirmDeleteButton({
  label,
  confirmLabel,
  id,
  action,
}: ConfirmDeleteButtonProps) {
  const { dict } = useI18n();
  const resolvedLabel = label ?? dict.dialog.delete;
  const resolvedConfirm = confirmLabel ?? dict.dialog.confirmDelete;
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        {resolvedLabel}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void (async () => {
                try {
                  await action(id);
                  setConfirming(false);
                  setError(null);
                } catch {
                  setError(dict.dialog.operationFailed);
                }
              })();
            })
          }
        >
          {pending ? "..." : resolvedConfirm}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          {dict.dialog.cancel}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
