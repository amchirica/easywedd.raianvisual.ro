"use client";

import { useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

type Props = {
  workspaceId: string;
  id: string;
  action: (workspaceId: string, id: string) => Promise<void>;
  label?: string;
  confirmLabel?: string;
};

export function AdminConfirmDelete({
  workspaceId,
  id,
  action,
  label,
  confirmLabel,
}: Props) {
  const { dict } = useI18n();
  const resolvedLabel = label ?? dict.dialog.delete;
  const resolvedConfirm = confirmLabel ?? dict.dialog.confirm;
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {resolvedLabel}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void action(workspaceId, id).then(() => setConfirming(false));
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
  );
}
