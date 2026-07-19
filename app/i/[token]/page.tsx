import type { Metadata } from "next";

import { InvitationCanvas } from "@/components/invitations/invitation-canvas";
import { InvitationRsvpForm } from "@/components/invitations/invitation-rsvp-form";
import { recordInvitationOpenAction } from "@/lib/actions/invitation-rsvp";
import {
  parseContentConfig,
  parseThemeConfig,
} from "@/lib/invitations/renderer-defaults";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Invitație",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ token: string }> };

type InvitationPayload = {
  error?: string;
  first_name?: string;
  rsvp_completed?: boolean;
  theme_config?: unknown;
  content_config?: unknown;
  rsvp_deadline?: string | null;
  attendance_count?: number;
  children_count?: number;
  meal_preference?: string | null;
  allergies?: string | null;
  transport_needed?: boolean;
  accommodation_needed?: boolean;
};

export default async function PublicInvitationPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation_by_recipient_token", {
    p_token: token,
  });

  const payload = (data ?? null) as InvitationPayload | null;

  if (error || !payload || payload.error === "not_published") {
    return (
      <Shell>
        <h1 className="font-heading text-3xl">Invitație indisponibilă</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Link invalid sau invitația nu este încă publicată.
        </p>
      </Shell>
    );
  }

  await recordInvitationOpenAction(token);

  const theme = parseThemeConfig(payload.theme_config);
  const content = parseContentConfig(payload.content_config);

  return (
    <Shell>
      <InvitationCanvas
        theme={theme}
        content={content}
        guestName={payload.first_name}
        className="mx-auto max-w-xl border border-border"
      />
      <div className="mx-auto mt-8 max-w-xl">
        {payload.rsvp_completed ? (
          <p className="rounded-md border border-champagne/40 bg-secondary px-3 py-3 text-sm">
            Mulțumim, {payload.first_name}. Răspunsul tău este deja înregistrat.
          </p>
        ) : (
          <InvitationRsvpForm
            token={token}
            deadline={payload.rsvp_deadline}
            defaults={{
              attendance_count: payload.attendance_count ?? 1,
              children_count: payload.children_count ?? 0,
              meal_preference: payload.meal_preference ?? "",
              allergies: payload.allergies ?? "",
              transport_needed: payload.transport_needed ?? false,
              accommodation_needed: payload.accommodation_needed ?? false,
            }}
          />
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100svh] bg-[#F7F4EF] px-4 py-10 text-[#2A2420]">
      {children}
    </main>
  );
}
