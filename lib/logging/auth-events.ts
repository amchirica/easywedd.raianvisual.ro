export type AuthEventName =
  | "AUTH_SIGNUP_START"
  | "AUTH_SIGNUP_SUCCESS"
  | "AUTH_SIGNUP_CONFIRMATION_REQUIRED"
  | "AUTH_SIGNUP_ERROR"
  | "AUTH_RESEND_CONFIRMATION"
  | "AUTH_CALLBACK_START"
  | "AUTH_CALLBACK_EXCHANGE_SUCCESS"
  | "AUTH_CALLBACK_EXCHANGE_ERROR"
  | "AUTH_CALLBACK_RECOVERY"
  | "PROFILE_ENSURE_SUCCESS"
  | "PROFILE_ENSURE_ERROR"
  | "ONBOARDING_START"
  | "ONBOARDING_RPC_SUCCESS"
  | "ONBOARDING_RPC_ERROR"
  | "PARTNER_INVITE_CREATED"
  | "PARTNER_EMAIL_SEND_START"
  | "PARTNER_EMAIL_SEND_SUCCESS"
  | "PARTNER_EMAIL_SEND_ERROR"
  | "PARTNER_INVITE_ACCEPTED";

type AuthEventPayload = {
  requestId?: string;
  userId?: string | null;
  workspaceId?: string | null;
  code?: string | null;
  message?: string | null;
  ok?: boolean;
};

/** Structured server logs — never pass tokens, passwords, or API keys. */
export function logAuthEvent(
  event: AuthEventName,
  payload: AuthEventPayload = {},
) {
  console.info(`[auth:${event}]`, {
    event,
    ts: new Date().toISOString(),
    requestId: payload.requestId ?? null,
    userId: payload.userId ?? null,
    workspaceId: payload.workspaceId ?? null,
    code: payload.code ?? null,
    message: payload.message ?? null,
    ok: payload.ok ?? null,
  });
}
