import { renderPartnerInviteEmail } from "@/lib/emails/partner-invite";
import { logAuthEvent } from "@/lib/logging/auth-events";
import { isResendConfigured, sendTransactionalEmail } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";

type OutboxPayload = {
  invitation_id?: string;
  invite_url?: string;
  role?: string;
  inviter_name?: string;
  workspace_name?: string;
  expires_at?: string;
};

type OutboxRow = {
  id: string;
  event_type: string;
  recipient: string;
  payload: OutboxPayload | null;
};

/**
 * Process pending partner-invite (and similar) outbox rows for a workspace.
 * Onboarding succeeds even if Resend fails — emails retry later.
 */
export async function processWorkspaceEmailOutbox(
  workspaceId: string,
): Promise<{ sent: number; failed: number; skipped: number }> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("claim_email_outbox", {
    p_workspace_id: workspaceId,
    p_limit: 10,
  });

  if (error) {
    logAuthEvent("PARTNER_EMAIL_SEND_ERROR", {
      workspaceId,
      code: error.code,
      message: error.message,
      ok: false,
    });
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const list = (rows ?? []) as OutboxRow[];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  if (!isResendConfigured()) {
    for (const row of list) {
      await supabase.rpc("mark_email_outbox", {
        p_id: row.id,
        p_ok: false,
        p_error: "resend_not_configured",
      });
      failed += 1;
      logAuthEvent("PARTNER_EMAIL_SEND_ERROR", {
        workspaceId,
        message: "resend_not_configured",
        ok: false,
      });
    }
    return { sent, failed, skipped };
  }

  for (const row of list) {
    if (row.event_type !== "partner_invite") {
      await supabase.rpc("mark_email_outbox", {
        p_id: row.id,
        p_ok: false,
        p_error: "unsupported_event_type",
      });
      skipped += 1;
      continue;
    }

    const payload = (row.payload ?? {}) as OutboxPayload;
    const inviteUrl =
      typeof payload.invite_url === "string" ? payload.invite_url : undefined;
    if (!inviteUrl) {
      await supabase.rpc("mark_email_outbox", {
        p_id: row.id,
        p_ok: false,
        p_error: "missing_invite_url",
      });
      failed += 1;
      continue;
    }

    logAuthEvent("PARTNER_EMAIL_SEND_START", {
      workspaceId,
      ok: true,
    });

    const email = renderPartnerInviteEmail({
      inviterName: payload.inviter_name || "Un partener",
      workspaceName: payload.workspace_name || "spațiul de nuntă",
      role: payload.role || "partner",
      inviteUrl,
      expiresAt: payload.expires_at ?? null,
    });

    const result = await sendTransactionalEmail({
      to: row.recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (result.ok) {
      await supabase.rpc("mark_email_outbox", {
        p_id: row.id,
        p_ok: true,
        p_error: null,
      });
      sent += 1;
      logAuthEvent("PARTNER_EMAIL_SEND_SUCCESS", {
        workspaceId,
        ok: true,
      });
    } else {
      await supabase.rpc("mark_email_outbox", {
        p_id: row.id,
        p_ok: false,
        p_error: result.skipped ? "resend_not_configured" : "resend_send_failed",
      });
      failed += 1;
      logAuthEvent("PARTNER_EMAIL_SEND_ERROR", {
        workspaceId,
        message: result.skipped ? "resend_not_configured" : "resend_send_failed",
        ok: false,
      });
    }
  }

  return { sent, failed, skipped };
}
