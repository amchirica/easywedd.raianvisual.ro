"use server";

import { answerAssistantQuestion } from "@/lib/assistant/answer";
import { normalizeAssistantPathname } from "@/lib/assistant/navigation";
import {
  ASSISTANT_RATE_LIMIT,
  checkAssistantRateLimit,
} from "@/lib/assistant/rate-limit";
import type {
  AssistantAskResult,
  AssistantFeedbackInput,
} from "@/lib/assistant/types";
import { trackProductEvent } from "@/lib/analytics/product";
import { safeLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext, getWorkspaceEntitlementRows } from "@/lib/workspace";

export type AssistantAskActionResult =
  | { ok: true; result: AssistantAskResult }
  | { ok: false; error: string };

export async function askAssistantAction(input: {
  message: string;
  pathname: string;
}): Promise<AssistantAskActionResult> {
  const context = await getCurrentUserContext();
  if (!context.user) {
    return { ok: false, error: "unauthenticated" };
  }

  const rate = checkAssistantRateLimit(context.user.id);
  if (!rate.ok) {
    return {
      ok: false,
      error: "rate_limited",
    };
  }

  const message = String(input.message ?? "").trim();
  if (!message) {
    return { ok: false, error: "empty" };
  }
  if (message.length > ASSISTANT_RATE_LIMIT.maxInputChars) {
    return { ok: false, error: "too_long" };
  }

  const locale = safeLocale(await getRequestLocale()) as Locale;
  const pathname = normalizeAssistantPathname(String(input.pathname || "/dashboard"));

  const entitlementRows = context.activeWorkspace?.id
    ? await getWorkspaceEntitlementRows(context.activeWorkspace.id)
    : [];
  const entitlements = entitlementRows.map((row) => ({
    feature_key: row.feature_key,
    enabled: row.enabled,
  }));
  const enabledFeatures = entitlements
    .filter((e) => e.enabled)
    .map((e) => e.feature_key);

  // Resolve workspace role without loading guest PII
  let role: string | null = null;
  if (context.activeWorkspace?.id) {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", context.activeWorkspace.id)
      .eq("user_id", context.user.id)
      .maybeSingle();
    role = membership?.role ?? null;
  }

  const result = await answerAssistantQuestion({
    message,
    entitlements,
    context: {
      pathname,
      locale,
      role,
      enabledFeatures,
    },
  });

  await trackProductEvent("assistant_ask", {
    workspaceId: context.activeWorkspace?.id,
    userId: context.user.id,
    properties: {
      category: result.category,
      page: pathname,
      answered: result.answered,
      source: result.source,
      matched_key: result.matchedKey,
      feature_unavailable: result.featureUnavailable,
    },
  });

  return { ok: true, result };
}

export async function submitAssistantFeedbackAction(
  input: AssistantFeedbackInput,
): Promise<{ ok: boolean }> {
  const context = await getCurrentUserContext();
  if (!context.user) return { ok: false };

  const comment = input.comment?.trim().slice(0, 280);
  await trackProductEvent("assistant_feedback", {
    workspaceId: context.activeWorkspace?.id,
    userId: context.user.id,
    properties: {
      helpful: Boolean(input.helpful),
      category: input.category ?? null,
      page: input.pathname
        ? normalizeAssistantPathname(input.pathname)
        : null,
      matched_key: input.matchedKey ?? null,
      // Store only a short non-sensitive hint — never full conversation
      has_comment: Boolean(comment),
      comment_len: comment?.length ?? 0,
    },
  });

  return { ok: true };
}
