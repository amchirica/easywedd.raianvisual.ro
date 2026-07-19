"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  workspaceId: string;
  id: string;
  action: (workspaceId: string, id: string) => Promise<void>;
  label?: string;
};

export function AdminConfirmDelete({
  workspaceId,
  id,
  action,
  label = "Șterge",
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {label}
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
        {pending ? "..." : "Confirmă"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Anulează
      </Button>
    </div>
  );
}
