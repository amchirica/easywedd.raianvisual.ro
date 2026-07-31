# Auth, confirmare email și onboarding EasyWedd

## Flux reparat

```text
signup
→ (opțional) check-email + confirmare Supabase Auth
→ /auth/confirm (verifyOtp cu token_hash)
→ ensure_own_profile
→ /dashboard (sau onboarding via middleware)
→ create_onboarding_workspace (RPC)
→ workspace + owner membership + wedding + consent
→ workspace_invitations + email_outbox (dacă există partner_email)
→ procesare outbox prin Resend
→ acceptare invitație (/invite/<token>)
```

Configurare detaliată Supabase Dashboard: vezi [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md).

## Separarea emailurilor

| Tip | Provider |
|-----|----------|
| Confirmare cont / reset parolă | **Supabase Auth** (template + SMTP opțional) |
| Invitație partener | **Resend** (via `email_outbox`) |

## Variabile de mediu

| Variabilă | Rol |
|-----------|-----|
| `NEXT_PUBLIC_SITE_URL` | Preferat — URL canonic (ex. `https://easywedd.raianvisual.ro`) |
| `NEXT_PUBLIC_APP_URL` | Alias acceptat de `getSiteUrl()` (același URL) |
| `RESEND_API_KEY` | Trimitere invitații partener |
| `RESEND_FROM_EMAIL` | Expeditor (ex. `notifications@easywedd.raianvisual.ro`) |
| `RESEND_FROM_NAME` | Opțional (ex. `EasyWedd`) |

Helper central: `lib/url.ts` → `getSiteUrl()`, `getSignupEmailRedirectTo()`, `getPasswordResetRedirectTo()`.

Redirect-uri auth (destinații logice; template-ul trimite la `/auth/confirm`):
- Signup: `emailRedirectTo` → `/dashboard`
- Reset: `redirectTo` → `/auth/reset-password`

## Flux resetare parolă

```text
/auth/forgot-password
→ resetPasswordForEmail(redirectTo = /auth/reset-password)
→ email Supabase (token_hash + type=recovery → /auth/confirm)
→ /auth/confirm (verifyOtp)
→ /auth/reset-password (sesiune recovery)
→ updateUser({ password })
→ signOut
→ /login?password_updated=1
```

Nu rulează onboarding, nu creează workspace, nu acordă entitlements.

### Email Templates → Reset Password

Subject:

```text
Resetează parola contului EasyWedd
```

Body (HTML), preferă `token_hash`:

```html
<h2>Resetare parolă EasyWedd</h2>
<p>Am primit o cerere de resetare a parolei pentru contul tău.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password">
    Resetează parola
  </a>
</p>
<p>Linkul expiră în scurt timp. Dacă nu ai solicitat tu resetarea, ignoră acest email.</p>
```

Nu construi manual token-uri. Nu expune codul de recovery în UI.

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

Allowed redirects:

```text
https://easywedd.raianvisual.ro/**
https://easywedd.raianvisual.ro/auth/confirm
https://easywedd.raianvisual.ro/auth/reset-password
http://localhost:3000/**
http://localhost:3000/auth/confirm
http://localhost:3000/auth/reset-password
```

Site URL:

```text
https://easywedd.raianvisual.ro
```

Cloudflare Variables (obligatoriu în producție):

```text
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
```

Nu seta `APP_URL=http://localhost:3000` pe Cloudflare.

### Email Templates → Confirm signup

Preferă template-ul cu `token_hash` (vezi [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md)):

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">
  Confirmă contul
</a>
```

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
