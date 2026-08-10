"use server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { logAdminInfo } from "@/lib/admin/log";
import { sendTransactionalEmail } from "@/lib/resend";
import { maskEmail } from "@/lib/admin/diagnostics-mask";

/**
 * Sends a diagnostics test email to the current platform admin only.
 * Requires explicit client confirmation before invoking.
 */
export async function sendAdminDiagnosticsTestEmailAction(): Promise<{
  ok: boolean;
  error?: string;
  maskedRecipient?: string;
}> {
  const auth = await requirePlatformAdmin();
  if (!auth.ok || !auth.user?.email) {
    return { ok: false, error: auth.error ?? "Acces admin necesar" };
  }

  const to = auth.user.email;
  const result = await sendTransactionalEmail({
    to,
    subject: "[EasyWedd] Diagnostics test email",
    html: `<p>Acesta este un email de test din <strong>/admin/diagnostics</strong>.</p><p>Dacă îl primești, Resend este configurat corect.</p>`,
    text: "Acesta este un email de test din /admin/diagnostics.",
  });

  logAdminInfo(
    { route: "/admin/diagnostics", operation: "sendTestEmail" },
    {
      ok: result.ok,
      skipped: "skipped" in result ? result.skipped : false,
      maskedRecipient: maskEmail(to),
    },
  );

  if (!result.ok) {
    return {
      ok: false,
      error:
        "skipped" in result && result.skipped
          ? "Resend nu este configurat (API key / from missing)"
          : ("error" in result && result.error) || "Trimitere eșuată",
      maskedRecipient: maskEmail(to) ?? undefined,
    };
  }

  return { ok: true, maskedRecipient: maskEmail(to) ?? undefined };
}
