"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fulfillPendingCheckoutsForUser } from "@/lib/billing/claim-checkout";
import { upsertConsents } from "@/lib/consents";
import { reportAuthError } from "@/lib/auth/map-auth-error";
import { logAuthEvent } from "@/lib/logging/auth-events";
import { createClient } from "@/lib/supabase/server";
import {
  getPasswordResetRedirectTo,
  getSafeNextPath,
  getSignupEmailRedirectTo,
  getSiteUrl,
} from "@/lib/url";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendConfirmationSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import type { ConsentType } from "@/types/database";

export type ActionResult = {
  error?: string;
  success?: string;
  redirectTo?: string;
  code?: string;
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
  await upsertConsents(supabase, userId, consents, source, null);
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const requestId = crypto.randomUUID();
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
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const mapped = reportAuthError({
      flow: "login",
      requestId,
      error,
    });
    return { error: mapped.message, code: mapped.code };
  }

  const user = signInData.user;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("suspended_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.suspended_at) {
      await supabase.auth.signOut();
      return { error: "Contul este suspendat. Contactează suportul." };
    }

    const claim = String(formData.get("claim") || "").trim() || null;
    try {
      await fulfillPendingCheckoutsForUser({
        userId: user.id,
        email: user.email ?? parsed.data.email,
        claimToken: claim,
      });
    } catch {
      /* claim retry after onboarding */
    }
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

  const claim = String(formData.get("claim") || "").trim() || null;
  const supabase = await createClient();
  // Logical destination after confirm — template sends users to /auth/confirm.
  const emailRedirectTo = getSignupEmailRedirectTo();

  const siteUrl = getSiteUrl();
  if (process.env.NODE_ENV !== "production") {
    console.info("[auth:signup:attempt]", {
      requestId,
      environment: process.env.NODE_ENV,
      siteUrl,
      emailRedirectTo,
      // Never log email/password
    });
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        source: "easywedd_registration",
        pending_marketing: parsed.data.marketing,
        pending_analytics: parsed.data.analytics,
        pending_claim_token: claim,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    const mapped = reportAuthError({
      flow: "signup",
      requestId,
      error,
      redirectUrl: emailRedirectTo,
    });
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
      code: "user_already_exists",
      ok: false,
    });
    return {
      success: false,
      message: "Există deja un cont asociat acestei adrese de email.",
      code: "user_already_exists",
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
    secure: siteUrl.startsWith("https"),
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
  const requestId = crypto.randomUUID();
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

  const emailRedirectTo = getSignupEmailRedirectTo();
  const supabase = await createClient();
  logAuthEvent("AUTH_RESEND_CONFIRMATION", { requestId, ok: true });

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo },
  });

  if (error) {
    reportAuthError({
      flow: "resend_confirmation",
      requestId,
      error,
      redirectUrl: emailRedirectTo,
    });
  }

  cookieStore.set(RESEND_COOLDOWN_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: getSiteUrl().startsWith("https"),
    path: "/",
    maxAge: 120,
  });

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
  const requestId = crypto.randomUUID();
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const siteUrl = getSiteUrl();
  // Final destination after confirm — template points to /auth/confirm.
  const redirectTo = getPasswordResetRedirectTo();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo },
  );

  if (error) {
    const mapped = reportAuthError({
      flow: "forgot_password",
      requestId,
      error,
      redirectUrl: redirectTo,
    });
    if (mapped.code === "over_email_send_rate_limit") {
      return { error: mapped.message, code: mapped.code };
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info("[auth:forgot]", {
      requestId,
      ok: true,
      siteUrl,
      redirectTo,
    });
  }

  return {
    success:
      "Dacă există un cont asociat acestei adrese, vei primi în câteva minute un link pentru resetarea parolei.",
  };
}

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const requestId = crypto.randomUUID();
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Linkul de resetare este invalid sau a expirat.",
      code: "recovery_link_invalid",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    const mapped = reportAuthError({
      flow: "reset_password",
      requestId,
      error,
    });
    return { error: mapped.message, code: mapped.code };
  }

  await supabase.auth.signOut();

  return {
    success: "Parola a fost actualizată cu succes.",
    redirectTo: "/auth/password-updated",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
