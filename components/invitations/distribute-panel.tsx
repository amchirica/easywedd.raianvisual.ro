"use client";

import { startTransition, useState } from "react";

import { InvitationQrCode } from "@/components/invitations/qr-code";
import { RecipientTable } from "@/components/invitations/recipient-table";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendInvitationEmailAction } from "@/lib/actions/invitations";
import { buildWhatsAppShareUrl } from "@/lib/invitations/whatsapp";
import { cn } from "@/lib/utils";

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

type DistributePanelProps = {
  projectId: string;
  previewUrl: string;
  coupleLabel: string;
  guests: GuestOption[];
  recipients: RecipientRow[];
  baseUrl: string;
};

export function DistributePanel({
  projectId,
  previewUrl,
  coupleLabel,
  guests,
  recipients,
  baseUrl,
}: DistributePanelProps) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const wa = buildWhatsAppShareUrl(previewUrl, coupleLabel);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.invitations.couplePreviewLink}</h2>
        <p className="break-all text-sm text-muted-foreground">{previewUrl}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(previewUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? dict.invitations.copied : dict.invitations.copyLink}
          </Button>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {dict.invitations.whatsappManual}
          </a>
        </div>
        <InvitationQrCode value={previewUrl} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.invitations.emailOneToOne}</h2>
        <p className="text-sm text-muted-foreground">
          {dict.invitations.emailOneToOneHint}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{dict.invitations.recipient}</Label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
            >
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.guest?.first_name} {r.guest?.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{dict.common.email}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.invitations.emailPlaceholder}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{dict.invitations.inviteUrlLabel}</Label>
            <Input
              value={inviteUrl}
              onChange={(e) => setInviteUrl(e.target.value)}
              placeholder={`${baseUrl}/i/...`}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={!recipientId || !email || !inviteUrl}
          onClick={() => {
            startTransition(() => {
              void sendInvitationEmailAction(
                projectId,
                recipientId,
                email,
                inviteUrl,
              );
            });
          }}
        >
          {dict.invitations.sendEmail}
        </Button>
      </section>

      <RecipientTable
        projectId={projectId}
        guests={guests}
        recipients={recipients}
        baseUrl={baseUrl}
      />
    </div>
  );
}
