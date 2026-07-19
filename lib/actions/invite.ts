"use server";

import { redirect } from "next/navigation";

import { logAuthEvent } from "@/lib/logging/auth-events";
import { createClient } from "@/lib/supabase/server";
import { setActiveWorkspaceId } from "@/lib/workspace";

export type InviteActionResult = {
  error?: string;
};

function mapInviteError(message: string | undefined): string {
  const msg = (message ?? "").toLowerCase();
  if (msg.includes("not_authenticated")) {
    return "Sesiunea a expirat. Autentifică-te din nou.";
  }
  if (msg.includes("invite_already_accepted")) {
    return "Invitația a fost deja acceptată.";
  }
  if (msg.includes("invite_expired")) {
    return "Invitația a expirat. Solicită o invitație nouă.";
  }
  if (msg.includes("invite_revoked")) {
    return "Invitația a fost revocată.";
  }
  if (msg.includes("invite_email_mismatch")) {
    return "Această invitație a fost trimisă către un alt email. Autentifică-te cu adresa invitată.";
  }
  if (msg.includes("invite_not_found")) {
    return "Invitația nu este validă sau a expirat.";
  }
  return "Nu am putut accepta invitația. Încearcă din nou.";
}

export async function acceptInviteAction(
  token: string,
): Promise<InviteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const { data, error } = await supabase.rpc("accept_workspace_invitation", {
    p_token: token,
  });

  if (error || !data) {
    logAuthEvent("PARTNER_INVITE_ACCEPTED", {
      userId: user.id,
      code: error?.code,
      message: error?.message ?? "empty",
      ok: false,
    });
    return { error: mapInviteError(error?.message) };
  }

  const result = data as { workspace_id?: string };
  if (result.workspace_id) {
    await setActiveWorkspaceId(result.workspace_id);
    logAuthEvent("PARTNER_INVITE_ACCEPTED", {
      userId: user.id,
      workspaceId: result.workspace_id,
      ok: true,
    });
  }

  redirect("/dashboard");
}
