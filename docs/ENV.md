# Variabile de mediu EasyWedd

## Obligatorii (local + producție)

| Variabilă | Descriere |
|-----------|-----------|
| `NEXT_PUBLIC_SITE_URL` | URL canonic. Local: `http://localhost:3000`. Producție: `https://easywedd.raianvisual.ro`. **Obligatoriu în producție** — fără el auth redirectează greșit. |
| `NEXT_PUBLIC_APP_URL` | Alias opțional (același URL ca SITE_URL). Evită valori contradictorii. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proiect Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cheia anon (publică) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — **doar server** (`import "server-only"` / `createAdminClient`). Niciodată în client. |

## Cloudflare Worker (producție)

Setează în **Workers & Pages → easywedd-raianvisual → Settings → Variables and Secrets**
(nu în `.env.local` din repo):

```text
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   (Secret)
```

Opțional: Stripe / Resend / OpenAI keys ca **Secrets** (nu plain Variables):

```text
STRIPE_SECRET_KEY=...          (Secret)
STRIPE_WEBHOOK_SECRET=...      (Secret)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_PASS_12=price_...
STRIPE_PRICE_PREMIUM_PASS_18=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
RESEND_API_KEY=...             (Secret)
RESEND_FROM_EMAIL=...
RESEND_FROM_NAME=EasyWedd
OPENAI_API_KEY=...             (Secret, optional)
```

`getSiteUrl()` în producție **ignoră localhost** și folosește `https://easywedd.raianvisual.ro` dacă SITE/APP URL lipsește sau e greșit — altfel Supabase blochează emailurile Auth.

## Billing (Stripe)

| Variabilă | Descriere |
|-----------|-----------|
| `STRIPE_SECRET_KEY` | Server-side |
| `STRIPE_WEBHOOK_SECRET` | Webhook `/api/stripe/webhook` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client |
| `STRIPE_PRICE_*` | **Price** IDs (`price_…`) — obligatorii pentru Checkout |
| `STRIPE_PRODUCT_*` | **Product** IDs (`prod_…`) — doar referință; nu se trimit la Checkout |

## Email (Resend)

| Variabilă | Descriere |
|-----------|-----------|
| `RESEND_API_KEY` | Outbox tranzacțional |
| `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME` | Expeditor |

## Assistant AI (opțional)

| Variabilă | Descriere |
|-----------|-----------|
| `OPENAI_API_KEY` | Secret — doar server; fără el asistentul rămâne pe knowledge base |
| `OPENAI_BASE_URL` | Opțional (gateway compatibil) |
| `OPENAI_ASSISTANT_MODEL` | Opțional |

Confirmarea de cont o trimite **Supabase Auth**, nu Resend.

## Setup rapid

1. Copiază `.env.example` → `.env.local` (doar local)
2. Completează Supabase Settings → API
3. Aplică migrațiile până la `20260719000013_...`
4. Auth redirect URLs — vezi raportul din `docs/AUTH_ONBOARDING.md`
5. În Cloudflare, setează variabilele de mai sus

## Securitate

- Nu comite `.env.local` / `.dev.vars`
- Nu loga valori secret
- Service role doar prin `lib/supabase/admin.ts`
