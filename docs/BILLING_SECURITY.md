# Billing & secrets hardening (ops checklist)

## Apply DB migration

In Supabase SQL Editor (or CLI), apply:

`supabase/migrations/20260719000021_billing_security_hardening.sql`

This:

- removes owner INSERT/UPDATE RLS on `subscriptions` and `feature_entitlements`
- adds `stripe_events.processing_ok` for webhook retries
- treats `past_due` as expired in `sync_workspace_entitlements`

## Cloudflare Worker secrets (production)

Workers & Pages → **easywedd-raianvisual** → Settings → Variables and Secrets:

```bash
# Via Wrangler (from project root) — values prompted, never commit:
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.jsonc
npx wrangler secret put STRIPE_SECRET_KEY --config wrangler.jsonc
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.jsonc
npx wrangler secret put RESEND_API_KEY --config wrangler.jsonc
npx wrangler secret put OPENAI_API_KEY --config wrangler.jsonc
```

Plain Variables (public / non-secret) — Dashboard → Variables → Add:

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PREMIUM_PASS_12`
- `STRIPE_PRICE_PREMIUM_PASS_18`
- `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`

Deploy **must** use `--keep-vars` (already in `npm run cf:deploy`) so Dashboard
Variables are not wiped. Runtime reads secrets via `getRuntimeEnv()` /
`getCloudflareContext().env` (not `.env.local`).

Admin check after deploy: `https://easywedd.raianvisual.ro/admin/diagnostics/stripe`


## Stripe Dashboard

1. Developers → Webhooks → endpoint `https://<your-domain>/api/stripe/webhook`
2. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET`
4. Rotate secret/API keys if they were ever exposed outside Secrets store

## Supabase

1. Rotate **service_role** if it was ever committed/shared (Dashboard → Settings → API → Reset)
2. Confirm Auth redirect URLs still match production site URL
3. Anon key stays public (RLS-bound)

## Resend

Rotate API key in Resend dashboard if exposed; set as Cloudflare Secret `RESEND_API_KEY`.
