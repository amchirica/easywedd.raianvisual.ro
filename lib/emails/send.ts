import {
  EMAIL_TEMPLATE_META,
  renderEmailHtml,
  type EmailTemplateId,
} from "@/lib/emails/templates";
import { sendTransactionalEmail } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/url";

export async function sendTemplatedEmail(
  templateId: EmailTemplateId,
  input: {
    to: string;
    userId?: string | null;
    vars?: Record<string, string>;
  },
) {
  const meta = EMAIL_TEMPLATE_META[templateId];

  if (input.userId) {
    const supabase = await createClient();
    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (prefs) {
      if (!prefs.transactional_enabled && meta.category === "transactional") {
        return { ok: false as const, skipped: true as const, reason: "prefs" };
      }
      if (!prefs.reminders_enabled && meta.category === "reminder") {
        return { ok: false as const, skipped: true as const, reason: "prefs" };
      }
      if (!prefs.marketing_enabled && meta.category === "marketing") {
        return { ok: false as const, skipped: true as const, reason: "prefs" };
      }
    }
  }

  const appUrl = getSiteUrl();

  return sendTransactionalEmail({
    to: input.to,
    subject: meta.subject,
    html: renderEmailHtml(templateId, {
      appUrl,
      ...(input.vars ?? {}),
    }),
  });
}
