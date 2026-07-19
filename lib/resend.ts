import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getFromAddress(): string | null {
  const email = process.env.RESEND_FROM_EMAIL?.trim();
  if (!email) return null;
  const name = process.env.RESEND_FROM_NAME?.trim();
  if (name && !email.includes("<")) {
    return `${name} <${email}>`;
  }
  return email;
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Transactional email helper. No-ops when Resend is not configured.
 * Never logs API keys.
 */
export async function sendTransactionalEmail(input: SendEmailInput) {
  const client = getResend();
  const from = getFromAddress();

  if (!client || !from) {
    console.info("[resend:noop]", {
      subject: input.subject,
      reason: "RESEND_API_KEY or RESEND_FROM_EMAIL missing",
    });
    return { ok: false as const, skipped: true as const };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error("[resend:error]", {
        subject: input.subject,
        message: error.message,
      });
      return { ok: false as const, skipped: false as const, error: error.message };
    }

    return { ok: true as const, skipped: false as const, id: data?.id ?? null };
  } catch (err) {
    console.error("[resend:exception]", {
      subject: input.subject,
      message: err instanceof Error ? err.message : "unknown",
    });
    return {
      ok: false as const,
      skipped: false as const,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
