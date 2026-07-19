# Auth, confirmare email și onboarding EasyWedd

## Flux reparat

```text
signup
→ (opțional) check-email + confirmare Supabase Auth
→ /auth/callback (exchangeCodeForSession)
→ ensure_own_profile
→ /dashboard/onboarding (sau /invite/<token>)
→ create_onboarding_workspace (RPC)
→ workspace + owner membership + wedding + consent
→ workspace_invitations + email_outbox (dacă există partner_email)
→ procesare outbox prin Resend
→ acceptare invitație (/invite/<token>)
```

## Separarea emailurilor

| Tip | Provider |
|-----|----------|
| Confirmare cont / reset parolă | **Supabase Auth** (template + SMTP opțional) |
| Invitație partener | **Resend** (via `email_outbox`) |

## Variabile de mediu

| Variabilă | Rol |
|-----------|-----|
| `NEXT_PUBLIC_SITE_URL` | Preferat — URL canonic (ex. `https://easywedd.raianvisual.ro`) |
| `NEXT_PUBLIC_APP_URL` | Alias acceptat de `getSiteUrl()` |
| `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` | Fallback automat pe Vercel |
| `RESEND_API_KEY` | Trimitere invitații partener |
| `RESEND_FROM_EMAIL` | Expeditor (ex. `notifications@easywedd.raianvisual.ro`) |
| `RESEND_FROM_NAME` | Opțional (ex. `EasyWedd`) |

Helper central: `lib/url.ts` → `getSiteUrl()`, `getSafeNextPath()`, `getAuthCallbackUrl()`.

## Setări manuale Supabase

### Site URL

```text
https://easywedd.raianvisual.ro
```

Local (sau proiect de staging separat):

```text
http://localhost:3000
```

### Redirect URLs

Adaugă în Authentication → URL Configuration:

```text
https://easywedd.raianvisual.ro/auth/callback
https://easywedd.raianvisual.ro/auth/callback/**
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/**
```

Supabase acceptă wildcard `/**` pe path. Nu folosi URL-uri externe.

### Email Templates → Confirm signup

Folosește linkul furnizat de Supabase (nu inventa unul):

- Proiecte cu PKCE / code flow: `{{ .ConfirmationURL }}`
- Verifică în dashboard template-ul activ și că redirect-ul duce la `/auth/callback`

### SMTP custom (opțional)

Authentication → SMTP Settings:

- sender name / sender email
- host, port, username, password
- rate limits

**Nu stoca credențiale SMTP în repository.**

Fără SMTP custom, emailurile de confirmare sunt trimise de infrastructura Supabase (pot intra în spam sau întârzia).

## Setări manuale Resend

1. Creează API key → `RESEND_API_KEY`
2. Verifică domeniul `easywedd.raianvisual.ro` (sau subdomain de mail)
3. Setează `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME`
4. Fără aceste valori, onboarding-ul reușește oricum; invitația rămâne în `email_outbox` pentru retry

## Migrații relevante

- `00009` / `00010` — profil + `create_onboarding_workspace`
- `00011` — `workspace_invitations`, `email_outbox`, `accept_workspace_invitation`, outbox claim/mark, partner invite în onboarding RPC

Aplică `00011` pe proiectul Supabase înainte de testul end-to-end.
