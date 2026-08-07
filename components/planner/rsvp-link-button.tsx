"use client";

import { useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

type RsvpLinkButtonProps = {
  guestId: string;
  action: (guestId: string) => Promise<{ rsvpUrl?: string; error?: string }>;
};

export function RsvpLinkButton({ guestId, action }: RsvpLinkButtonProps) {
  const { dict } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await action(guestId);
            if (result.rsvpUrl) {
              setUrl(result.rsvpUrl);
              await navigator.clipboard.writeText(result.rsvpUrl);
            } else {
              window.alert(result.error ?? dict.common.error);
            }
          })
        }
      >
        {pending ? "..." : dict.guests.linkRsvp}
      </Button>
      {url ? (
        <p className="max-w-xs truncate text-[10px] text-muted-foreground">{url}</p>
      ) : null}
    </div>
  );
}
