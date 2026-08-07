import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "@/lib/actions/invite";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.publicUi.inviteMetaTitle };
}

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

function maskEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { publicUi } = dict;
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: previewRows } = await supabase.rpc(
    "get_workspace_invitation_preview",
    { p_token: token },
  );
  const preview = Array.isArray(previewRows) ? previewRows[0] : previewRows;

  // Fallback to legacy lookup if new table has no row
  let legacyInvite: {
    role: string;
    invite_email: string | null;
  } | null = null;
  if (!preview) {
    const { data: legacyRows } = await supabase.rpc("get_pending_invite", {
      p_token: token,
    });
    const legacy = Array.isArray(legacyRows) ? legacyRows[0] : legacyRows;
    if (legacy) {
      legacyInvite = {
        role: legacy.role,
        invite_email: legacy.invite_email,
      };
    }
  }

  const isExpired = Boolean(preview?.is_expired);
  const isPending =
    (preview?.status === "pending" && !isExpired) || Boolean(legacyInvite);
  const role = preview?.role ?? legacyInvite?.role ?? null;
  const masked = maskEmail(preview?.email ?? legacyInvite?.invite_email);

  async function accept() {
    "use server";
    await acceptInviteAction(token);
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[linear-gradient(160deg,#f7f4ef_0%,#fffdf9_50%,#efe8dc_100%)] px-6">
      <div className="w-full max-w-md border border-border bg-card p-8">
        <h1 className="font-heading text-3xl">{publicUi.inviteTitle}</h1>

        {!preview && !legacyInvite ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {publicUi.inviteInvalid}
          </p>
        ) : isExpired ||
          (preview && preview.status !== "pending" && !legacyInvite) ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {preview?.status === "accepted"
              ? publicUi.inviteAlreadyAccepted
              : publicUi.inviteExpired}
          </p>
        ) : !user ? (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              {masked
                ? publicUi.inviteAuthPromptWithEmail.replace("{email}", masked)
                : publicUi.inviteAuthPrompt}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {publicUi.inviteDetailsAfterAuth}
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
                className="text-sm underline underline-offset-4"
              >
                {publicUi.inviteLogin}
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(`/invite/${token}`)}`}
                className="text-sm underline underline-offset-4"
              >
                {publicUi.inviteRegister}
              </Link>
            </div>
          </>
        ) : isPending ? (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              {masked
                ? publicUi.inviteWillJoinWithEmail
                    .replace("{role}", String(role ?? ""))
                    .replace("{email}", masked)
                : publicUi.inviteWillJoin.replace(
                    "{role}",
                    String(role ?? ""),
                  )}
            </p>
            <form action={accept} className="mt-6">
              <Button type="submit" className="w-full">
                {publicUi.inviteAccept}
              </Button>
            </form>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {publicUi.inviteCannotAccept}
          </p>
        )}
      </div>
    </div>
  );
}
