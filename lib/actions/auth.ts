"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CONSENT_VERSION } from "@/lib/constants";
import { logAuthEvent } from "@/lib/logging/auth-events";
import { createClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl, getSafeNextPath, getSiteUrl } from "@/lib/url";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendConfirmationSchema,
} from "@/lib/validations/auth";
import type { ConsentType } from "@/types/database";

export type ActionResult = {
  error?: string;
  success?: string;
};

export type SignupResult =
  | {
      success: true;
      requiresEmailConfirmation: true;
      email: string;
    }
  | {
      success: true;
      requiresEmailConfirmation: false;
      redirectTo: string;
    }
  | {
      success: false;
      fieldErrors?: Record<string, string[]>;
      message: string;
      code?: string;
    };

export type ResendConfirmationResult = {
  ok: boolean;
  message: string;
};

const PENDING_EMAIL_COOKIE = "ew_pending_signup_email";
const RESEND_COOLDOWN_COOKIE = "ew_resend_confirm_at";
const RESEND_COOLDOWN_MS = 60_000;

async function recordConsents(
  userId: string,
  consents: { type: ConsentType; granted: boolean }[],
  source: string,
) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const rows = consents.map((consent) => ({
    user_id: userId,
    workspace_id: null as string | null,
    consent_type: consent.type,
    consent_version: CONSENT_VERSION,
    granted: consent.granted,
    granted_at: consent.granted ? now : null,
    revoked_at: consent.granted ? null : now,
    source,
  }));

  const { error } = await supabase.from("user_consents").insert(rows);
  if (error) {
    console.error("[auth:consents]", { code: error.code, message: error.message });
  }
}

function mapAuthError(error: { message: string; code?: string; status?: number }) {
  const msg = error.message.toLowerCase();
  if (msg.includes("already registered") || msg.includes("user already")) {
    return {
      message:
        "Există deja un cont cu acest email. Autentifică-te sau resetează parola.",
      code: "email_taken",
    };
  }
  if (msg.includes("password") && (msg.includes("weak") || msg.includes("least"))) {
    return { message: "Parola este prea slabă. Folosește cel puțin 8 caractere.", code: "weak_password" };
  }
  if (msg.includes("rate") || error.status === 429) {
    return {
      message: "Prea multe încercări. Așteaptă puțin și încearcă din nou.",
      code: "rate_limit",
    };
  }
  if (msg.includes("invalid") && msg.includes("email")) {
    return { message: "Adresa de email nu este validă.", code: "invalid_email" };
  }
  return {
    message: "Nu am putut crea contul. Verifică datele și încearcă din nou.",
    code: error.code ?? "signup_failed",
  };
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error:
        error.message.toLowerCase().includes("invalid")
          ? "Email sau parolă incorrectă."
          : "Nu am putut autentifica. Încearcă din nou.",
    };
  }

  const next = getSafeNextPath(String(formData.get("next") || ""), "/dashboard");
  redirect(next);
}

export async function registerAction(
  _prev: SignupResult | ActionResult,
  formData: FormData,
): Promise<SignupResult> {
  const requestId = crypto.randomUUID();
  const nextPath = getSafeNextPath(
    String(formData.get("next") || ""),
    "/dashboard/onboarding",
  );

  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: formData.get("password"),
    accept_terms: formData.get("accept_terms") === "on",
    accept_privacy: formData.get("accept_privacy") === "on",
    marketing: formData.get("marketing") === "on",
    analytics: formData.get("analytics") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] ? String(issue.path[0]) : "form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Date invalide",
      fieldErrors,
    };
  }

  logAuthEvent("AUTH_SIGNUP_START", { requestId });

  const supabase = await createClient();
  const emailRedirectTo = getAuthCallbackUrl(nextPath);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        source: "easywedd_registration",
        pending_marketing: parsed.data.marketing,
        pending_analytics: parsed.data.analytics,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    const mapped = mapAuthError(error);
    logAuthEvent("AUTH_SIGNUP_ERROR", {
      requestId,
      code: mapped.code,
      message: mapped.message,
      ok: false,
    });
    return {
      success: false,
      message: mapped.message,
      code: mapped.code,
    };
  }

  // Supabase may return a user without identities when email is already taken
  // (depending on project "Confirm email" / leak protection settings).
  const identities = data.user?.identities;
  if (data.user && Array.isArray(identities) && identities.length === 0) {
    logAuthEvent("AUTH_SIGNUP_ERROR", {
      requestId,
      code: "email_taken",
      ok: false,
    });
    return {
      success: false,
      message:
        "Există deja un cont cu acest email. Autentifică-te sau resetează parola.",
      code: "email_taken",
    };
  }

  if (data.user && data.session) {
    const { error: profileError } = await supabase.rpc("ensure_own_profile");
    if (profileError) {
      logAuthEvent("PROFILE_ENSURE_ERROR", {
        requestId,
        userId: data.user.id,
        code: profileError.code,
        message: profileError.message,
        ok: false,
      });
    } else {
      logAuthEvent("PROFILE_ENSURE_SUCCESS", {
        requestId,
        userId: data.user.id,
        ok: true,
      });
    }

    await recordConsents(
      data.user.id,
      [
        { type: "terms", granted: true },
        { type: "privacy", granted: true },
        { type: "marketing", granted: parsed.data.marketing },
        { type: "analytics", granted: parsed.data.analytics },
      ],
      "register",
    );

    logAuthEvent("AUTH_SIGNUP_SUCCESS", {
      requestId,
      userId: data.user.id,
      ok: true,
    });

    return {
      success: true,
      requiresEmailConfirmation: false,
      redirectTo: nextPath,
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(PENDING_EMAIL_COOKIE, parsed.data.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSiteUrl().startsWith("https"),
    path: "/",
    maxAge: 60 * 60,
  });

  logAuthEvent("AUTH_SIGNUP_CONFIRMATION_REQUIRED", {
    requestId,
    userId: data.user?.id ?? null,
    ok: true,
  });

  return {
    success: true,
    requiresEmailConfirmation: true,
    email: parsed.data.email,
  };
}

export async function resendConfirmationAction(
  emailInput?: string,
): Promise<ResendConfirmationResult> {
  const cookieStore = await cookies();
  const last = cookieStore.get(RESEND_COOLDOWN_COOKIE)?.value;
  if (last) {
    const elapsed = Date.now() - Number(last);
    if (!Number.isNaN(elapsed) && elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        message: "Așteaptă cel puțin 60 de secunde înainte de a retrimite.",
      };
    }
  }

  const fromCookie = cookieStore.get(PENDING_EMAIL_COOKIE)?.value ?? "";
  const parsed = resendConfirmationSchema.safeParse({
    email: String(emailInput || fromCookie)
      .trim()
      .toLowerCase(),
  });

  if (!parsed.success) {
    return {
      ok: true,
      message:
        "Dacă adresa este eligibilă, un nou mesaj de confirmare a fost trimis.",
    };
  }

  const supabase = await createClient();
  logAuthEvent("AUTH_RESEND_CONFIRMATION", { ok: true });

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/dashboard/onboarding"),
    },
  });

  cookieStore.set(RESEND_COOLDOWN_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: getSiteUrl().startsWith("https"),
    path: "/",
    maxAge: 120,
  });

  if (error) {
    console.error("[auth:resend]", { code: error.code, message: error.message });
  }

  // Neutral message — avoid account enumeration
  return {
    ok: true,
    message:
      "Dacă adresa este eligibilă, un nou mesaj de confirmare a fost trimis.",
  };
}

export async function getPendingSignupEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PENDING_EMAIL_COOKIE)?.value ?? null;
}

export async function forgotPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getAuthCallbackUrl("/dashboard/settings"),
  });

  if (error) {
    console.error("[auth:forgot]", { code: error.code, message: error.message });
  }

  return {
    success:
      "Dacă există un cont cu acest email, vei primi instrucțiuni de resetare.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
