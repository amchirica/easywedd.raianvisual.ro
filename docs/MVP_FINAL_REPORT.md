# EasyWedd — Raport Etapa finală MVP

Data: 2026-07-19

## Verificare

| Check | Rezultat |
|-------|----------|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | OK (28 tests) |
| `npm run build` | OK |

## Funcții implementate

1. **Wedding Website Builder** — editor pe secțiuni + DnD, publish/unpublish/versions/duplicare, SEO, password, vizite, public `/w/[slug]`, sitemap
2. **Billing** — catalog Starter / Premium Pass 12–18 / Pro / Partner / White Label; Checkout + Portal + webhook; grant local fără Stripe
3. **Entitlements** — service central (`requireFeature`, limits, sync SQL)
4. **Raian contracts** — create workspace client, activation code, invite, extend/disable
5. **Product analytics** — `product_events` + hook-uri în actions
6. **Industry insights** — agregare SQL, prag ≥20, consent-gated
7. **Admin dashboard** — KPI-uri, analytics, insights, GDPR, contracts, sensitive access
8. **GDPR** — Privacy Center, export, cereri ștergere, preferințe email
9. **Emailuri tranzacționale** — template-uri Resend noop-safe

## Migrații noi

- `20260719000004_wedding_website.sql`
- `20260719000005_billing_entitlements.sql`
- `20260719000006_product_analytics.sql`
- `20260719000007_industry_insights_gdpr.sql`
- `20260719000008_admin_sensitive_access.sql`

Aplică-le în ordine în Supabase SQL Editor (dev).

## Rute noi (selecție)

- `/dashboard/website/**`, `/w/[slug]`, `/sitemap-weddings.xml`
- `/dashboard/billing`, `/dashboard/billing/success`, `/api/stripe/webhook`
- `/dashboard/privacy`
- `/admin/contracts`, `/admin/insights`, `/admin/gdpr`, `/admin/workspaces/[id]`

## Variabile de mediu

Vezi [`docs/ENV.md`](ENV.md) — Stripe price IDs + webhook secret + Resend.

## Limitări V1

- Fără DNS custom domain live / wildcard subdomain
- Industry refresh manual (admin)
- Stripe e2e necesită chei reale
- Gallery media = URL text
- Export GDPR fără listă completă invitați (cerere separată documentată)

## Riscuri

- Webhook Stripe necesită `SUPABASE_SERVICE_ROLE_KEY`
- Sitemap public depinde de service role
- Cohortă industry goală până la ≥20 workspace-uri cu consent

## Deployment

1. Aplică migrațiile 04–08
2. Setează env Stripe/Resend
3. Configurează webhook Stripe → `/api/stripe/webhook`
4. Deploy Next.js (fără schimbări Vercel/Docker în acest PR)
5. Smoke: publish site, RSVP, checkout (sau grant local), Privacy Center

## Documentație aferentă

- `docs/WEDDING_WEBSITE.md`
- `docs/CUSTOM_DOMAINS.md`
- `docs/INDUSTRY_INSIGHTS.md`
- `docs/GDPR.md`
- `docs/INVITATION_STUDIO.md` (anterior)
