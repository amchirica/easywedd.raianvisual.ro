/**
 * One-shot probe: call resetPasswordForEmail with local/prod redirectTo
 * and print the observed Supabase error (no secrets, no tokens).
 *
 * Usage: node --env-file=.env.local scripts/probe-forgot-password.mjs [email]
 */
import { createClient } from "@supabase/supabase-js";

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

function ensureProtocol(url) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1")) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

function isLocalhostUrl(url) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function resolveSiteUrl(mode) {
  if (mode === "production") {
    return "https://easywedd.raianvisual.ro";
  }
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];
  for (const candidate of candidates) {
    if (!candidate || candidate.includes("undefined")) continue;
    const normalized = stripTrailingSlash(ensureProtocol(candidate));
    if (normalized) return normalized;
  }
  return "http://localhost:3000";
}

function resetCallback(siteUrl) {
  return `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;
}

async function probe(mode, email) {
  const siteUrl = resolveSiteUrl(mode);
  const redirectTo = resetCallback(siteUrl);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("\n=== probe", mode, "===");
  console.log("siteUrl:", siteUrl);
  console.log("redirectTo:", redirectTo);
  console.log("supabaseUrl set:", Boolean(supabaseUrl));
  console.log("anon key set:", Boolean(anon));
  console.log("isLocalhost siteUrl:", isLocalhostUrl(siteUrl));

  if (!supabaseUrl || !anon) {
    console.log("RESULT: missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY");
    return;
  }

  const supabase = createClient(supabaseUrl, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.log("[auth:forgot] OBSERVED ERROR");
    console.log(
      JSON.stringify(
        {
          ok: false,
          siteUrl,
          redirectTo,
          code: error.code ?? null,
          message: error.message,
          status: error.status ?? null,
          name: error.name ?? null,
        },
        null,
        2,
      ),
    );
  } else {
    console.log("[auth:forgot] OBSERVED SUCCESS (API accepted request)");
    console.log(
      JSON.stringify(
        {
          ok: true,
          siteUrl,
          redirectTo,
          hasData: data != null,
          note: "API success does not prove mailbox delivery; check Supabase Auth logs.",
        },
        null,
        2,
      ),
    );
  }
}

const email = process.argv[2] || "probe-nonexistent@example.com";

await probe("local-env", email);
await probe("production", email);
