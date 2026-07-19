# Variabile de mediu EasyWedd

## Obligatorii

| Variabilă | Descriere |
|-----------|-----------|
| `NEXT_PUBLIC_SITE_URL` | URL canonic (local: `http://localhost:3000`, producție: `https://easywedd.raianvisual.ro`). Preferat față de `NEXT_PUBLIC_APP_URL`. |
| `NEXT_PUBLIC_APP_URL` | Alias acceptat de `getSiteUrl()` (compatibilitate) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proiect Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cheia anon (publică) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cheia service role — **doar server**, niciodată în client |

## Billing (Stripe)

| Variabilă | Descriere |
|-----------|-----------|
| `STRIPE_SECRET_KEY` | Client Stripe server-side; fără ea, checkout e inactiv (grant local în UI) |
| `STRIPE_WEBHOOK_SECRET` | Semnătură webhook `/api/stripe/webhook` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key |
| `STRIPE_PRICE_STARTER_MONTHLY` | Price ID Starter subscription |
| `STRIPE_PRICE_PREMIUM_PASS_12` | Price ID Premium Pass 12 luni (one-time) |
| `STRIPE_PRICE_PREMIUM_PASS_18` | Price ID Premium Pass 18 luni (one-time) |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID Pro subscription |

## Email (Resend) — invitații partener / tranzacționale app

| Variabilă | Descriere |
|-----------|-----------|
| `RESEND_API_KEY` | Trimite emailuri; fără ea → outbox rămâne pending / failed |
| `RESEND_FROM_EMAIL` | Expeditor (ex. `notifications@easywedd.raianvisual.ro`) |
| `RESEND_FROM_NAME` | Opțional (ex. `EasyWedd`) |

Confirmarea de cont **nu** trece prin Resend — o trimite Supabase Auth (vezi `docs/AUTH_ONBOARDING.md`).

## Setup rapid

1. Copiază `.env.example` → `.env.local`
2. Completează valorile din dashboard-ul Supabase (Settings → API)
3. Rulează migrațiile `20260719000000` … `00011` în SQL Editor (sau CLI)
4. Auth: Site URL + Redirect URLs (`/auth/callback`) — detalii în `docs/AUTH_ONBOARDING.md`
5. Stripe CLI (dev): `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Note de securitate

- Nu comite `.env.local`
- Service role doar în webhook / sitemap / cleanup GDPR
- Public wedding/invitation access doar prin RPC security definer
