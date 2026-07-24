/**
 * Map Supabase Auth errors → Romanian UI messages + structured server logs.
 * Never log passwords, tokens, or secret keys.
 */

export type AuthFlow =
  | "signup"
  | "login"
  | "forgot_password"
  | "reset_password"
  | "resend_confirmation"
  | "callback";

export type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
};

export type MappedAuthError = {
  /** Safe code for UI / tests */
  code: string;
  /** Romanian message for the user */
  message: string;
};

function envLabel(): string {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** Strip anything that looks like a token/secret from a message before logging. */
function sanitizeMessage(message: string | undefined): string | null {
  if (!message) return null;
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, "[jwt]")
    .slice(0, 500);
}

export function logSupabaseAuthError(options: {
  flow: AuthFlow;
  requestId: string;
  error: AuthErrorLike;
  redirectUrl?: string | null;
  mapped: MappedAuthError;
}) {
  const { flow, requestId, error, redirectUrl, mapped } = options;
  console.error(`[auth:${flow}:error]`, {
    requestId,
    flow,
    environment: envLabel(),
    supabase: {
      message: sanitizeMessage(error.message),
      code: error.code ?? null,
      status: error.status ?? null,
      name: error.name ?? null,
    },
    mapped: {
      code: mapped.code,
      message: mapped.message,
    },
    redirectUrl: redirectUrl ?? null,
    siteUrlConfigured: Boolean(
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL,
    ),
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  });
}

function normalize(error: AuthErrorLike) {
  return {
    message: (error.message ?? "").toLowerCase(),
    code: (error.code ?? "").toLowerCase(),
    status: error.status,
  };
}

/**
 * Map known Auth API errors to Romanian copy.
 * Unknown errors include a safe code for support/debugging.
 */
export function mapSupabaseAuthError(
  error: AuthErrorLike,
  flow: AuthFlow = "signup",
): MappedAuthError {
  const { message, code, status } = normalize(error);

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("user already") ||
    message.includes("already been registered")
  ) {
    return {
      code: "user_already_exists",
      message: "Există deja un cont asociat acestei adrese de email.",
    };
  }

  if (
    code === "email_address_invalid" ||
    (code === "validation_failed" && message.includes("email")) ||
    (message.includes("invalid") && message.includes("email"))
  ) {
    return {
      code: "email_address_invalid",
      message: "Adresa de email nu este validă.",
    };
  }

  if (
    code === "weak_password" ||
    (message.includes("password") &&
      (message.includes("weak") ||
        message.includes("least") ||
        message.includes("short") ||
        message.includes("strength")))
  ) {
    return {
      code: "weak_password",
      message: "Parola nu îndeplinește cerințele minime de securitate.",
    };
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("email rate")
  ) {
    return {
      code: "over_email_send_rate_limit",
      message: "Au fost trimise prea multe emailuri. Încearcă din nou mai târziu.",
    };
  }

  if (
    code === "signup_disabled" ||
    message.includes("signups not allowed") ||
    message.includes("signup is disabled")
  ) {
    return {
      code: "signup_disabled",
      message: "Crearea conturilor este momentan dezactivată.",
    };
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("confirm your email")
  ) {
    return {
      code: "email_not_confirmed",
      message: "Confirmă adresa de email înainte de autentificare.",
    };
  }

  if (
    code === "invalid_credentials" ||
    (flow === "login" &&
      (message.includes("invalid login") ||
        message.includes("invalid credentials")))
  ) {
    return {
      code: "invalid_credentials",
      message: "Email sau parolă incorrectă.",
    };
  }

  // SMTP / email provider failures (common when custom SMTP is misconfigured)
  if (
    code === "unexpected_failure" ||
    message.includes("error sending confirmation email") ||
    message.includes("error sending recovery email") ||
    message.includes("smtp") ||
    (message.includes("mail") &&
      (message.includes("fail") ||
        message.includes("deliver") ||
        message.includes("send")))
  ) {
    return {
      code: "smtp_error",
      message:
        "Contul nu a putut trimite emailul de confirmare. Contactează administratorul.",
    };
  }

  if (
    message.includes("redirect") &&
    (message.includes("not allowed") ||
      message.includes("whitelist") ||
      message.includes("allow"))
  ) {
    return {
      code: "redirect_url_not_allowed",
      message:
        "URL-ul de redirecționare nu este permis în configurarea Auth. Contactează administratorul.",
    };
  }

  if (flow === "reset_password" || flow === "forgot_password") {
    if (
      message.includes("expired") ||
      message.includes("invalid") ||
      code === "otp_expired"
    ) {
      return {
        code: "recovery_link_invalid",
        message: "Linkul de resetare este invalid sau a expirat.",
      };
    }
  }

  const safeCode =
    error.code?.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 64) ||
    (status ? `http_${status}` : "unknown");

  if (flow === "signup") {
    return {
      code: safeCode,
      message: `Contul nu a putut fi creat. Cod eroare: ${safeCode}`,
    };
  }

  if (flow === "login") {
    return {
      code: safeCode,
      message: `Autentificarea a eșuat. Cod eroare: ${safeCode}`,
    };
  }

  return {
    code: safeCode,
    message: `Operațiunea a eșuat. Cod eroare: ${safeCode}`,
  };
}

/** Log + map in one step for actions. */
export function reportAuthError(options: {
  flow: AuthFlow;
  requestId: string;
  error: AuthErrorLike;
  redirectUrl?: string | null;
}): MappedAuthError {
  const mapped = mapSupabaseAuthError(options.error, options.flow);
  logSupabaseAuthError({ ...options, mapped });
  return mapped;
}
