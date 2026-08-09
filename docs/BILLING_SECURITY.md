# Billing & secrets hardening (ops checklist)

## Apply DB migration

In Supabase SQL Editor (or CLI), apply:

`supabase/migrations/20260719000021_billing_security_hardening.sql`

This:

- removes owner INSERT/UPDATE RLS on `subscriptions` and `feature_entitlements`
- adds `stripe_events.processing_ok` for webhook retries
- treats `past_due` as expired in `sync_workspace_entitlements`

## Cloudflare Worker secrets (production)

Workers & Pages → your worker → Settings → Variables and Secrets:

```bash
# Via Wrangler (from project root) — values prompted, never commit:
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put OPENAI_API_KEY
```

Plain Variables (public / non-secret):

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional for hosted Checkout; required if you use Stripe.js/Elements)
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PREMIUM_PASS_12`
- `STRIPE_PRICE_PREMIUM_PASS_18`
- `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`

Secrets:

- `STRIPE_SECRET_KEY` (required for Checkout + Portal + webhook)
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `OPENAI_API_KEY` (if assistant enabled)

Local dev: copy `.dev.vars.example` → `.dev.vars` with `NEXTJS_ENV=development`, keep keys in `.env.local`, then restart `next dev`.


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
