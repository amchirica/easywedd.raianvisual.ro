"use client";

import { startTransition, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { addRecipientsFromGuestsAction } from "@/lib/actions/invitations";
import { t } from "@/lib/i18n/t";

type GuestOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

type RecipientRow = {
  id: string;
  guest_id: string;
  opened_at: string | null;
  rsvp_completed_at: string | null;
  guest?: GuestOption | null;
};

type RecipientTableProps = {
  projectId: string;
  guests: GuestOption[];
  recipients: RecipientRow[];
  baseUrl: string;
};

export function RecipientTable({
  projectId,
  guests,
  recipients,
  baseUrl,
}: RecipientTableProps) {
  const { dict, locale } = useI18n();
  const linked = new Set(recipients.map((r) => r.guest_id));
  const available = guests.filter((g) => !linked.has(g.id));
  const [selected, setSelected] = useState<string[]>([]);
  const [tokens, setTokens] = useState<{ guestId: string; token: string }[]>([]);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.invitations.addGuests}</h2>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {dict.invitations.allGuestsLinked}
          </p>
        ) : (
          <>
            <div className="max-h-56 space-y-2 overflow-y-auto border border-border p-3">
              {available.map((guest) => (
                <label key={guest.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(guest.id)}
                    onChange={(e) => {
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, guest.id]
                          : prev.filter((id) => id !== guest.id),
                      );
                    }}
                  />
                  {guest.first_name} {guest.last_name}
                  {guest.email ? ` · ${guest.email}` : ""}
                </label>
              ))}
            </div>
            <Button
              type="button"
              disabled={busy || selected.length === 0}
              onClick={() => {
                setBusy(true);
                startTransition(() => {
                  void addRecipientsFromGuestsAction(projectId, selected).then(
                    (result) => {
                      setTokens(result.tokens);
                      setSelected([]);
                      setBusy(false);
                    },
                  );
                });
              }}
            >
              {t(dict as never, "invitations.generateLinks", {
                locale,
                params: { count: selected.length },
              })}
            </Button>
          </>
        )}
      </div>

      {tokens.length > 0 ? (
        <div className="space-y-2 border border-champagne/40 bg-secondary/40 p-4">
          <p className="text-sm font-medium">{dict.invitations.newTokensOnce}</p>
          {tokens.map((tok) => (
            <p key={tok.token} className="break-all text-xs">
              {baseUrl}/i/{tok.token}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="font-heading text-2xl">{dict.invitations.recipients}</h2>
        <div className="divide-y divide-border border-y border-border">
          {recipients.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {dict.invitations.noRecipients}
            </p>
          ) : (
            recipients.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  {r.guest?.first_name} {r.guest?.last_name}
                </span>
                <span className="text-muted-foreground">
                  {r.rsvp_completed_at
                    ? dict.invitations.rsvpComplete
                    : r.opened_at
                      ? dict.invitations.opened
                      : dict.invitations.notOpened}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
