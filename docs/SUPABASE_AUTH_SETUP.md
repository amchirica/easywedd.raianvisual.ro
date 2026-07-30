# Supabase Auth Setup — EasyWedd

Ghid pentru configurarea manuală în Supabase Dashboard, astfel încât confirmarea
contului și resetarea parolei să funcționeze cu fluxul `token_hash` + `verifyOtp`
pe ruta `/auth/confirm`.

Domeniu producție: `https://easywedd.raianvisual.ro`

---

## 1. Authentication → URL Configuration

### Site URL

```text
https://easywedd.raianvisual.ro
```

### Redirect URLs

Adaugă exact (sau echivalent cu wildcards):

```text
https://easywedd.raianvisual.ro/**
https://easywedd.raianvisual.ro/auth/confirm
https://easywedd.raianvisual.ro/auth/reset-password
http://localhost:3000/**
http://localhost:3000/auth/confirm
http://localhost:3000/auth/reset-password
```

Opțional (compatibilitate cu linkuri vechi / PKCE):

```text
https://easywedd.raianvisual.ro/auth/callback
http://localhost:3000/auth/callback
```

---

## 2. Authentication → Providers → Email

1. Activează **Confirm email** (Enable email confirmations).
2. După ce aplicația este deploy-uită cu `/auth/confirm`, poți lăsa Confirm email **ON**.
3. Nu este necesar „Secure email change” pentru acest flux, dar e recomandat.

---

## 3. Email Templates (recomandate)

Folosește `token_hash` + tipul OTP, **nu** doar `{{ .ConfirmationURL }}` dacă vrei
control total asupra rutei. Ruta aplicației validează cu `supabase.auth.verifyOtp()`.

### Confirm signup

**Subject:** Confirmă contul EasyWedd

**Body (HTML):**

```html
<h2>Confirmă contul EasyWedd</h2>
<p>Apasă butonul de mai jos pentru a confirma adresa de email.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">
    Confirmă contul
  </a>
</p>
<p>Dacă nu ai creat tu acest cont, ignoră mesajul.</p>
```

### Reset password

**Subject:** Resetează parola contului EasyWedd

**Body (HTML):**

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

---

## 4. Variabile de mediu (aplicație)

În producție (Cloudflare Worker / secrets):

```text
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Local (`.env.local`):

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Nu** seta `NEXT_PUBLIC_APP_URL` la localhost în mediul de producție — emailurile
de confirmare / reset ar putea fi respinse de allow-list-ul Supabase.

Nu expune în client:

- `SUPABASE_SERVICE_ROLE_KEY`
- parole, tokenuri, chei private

---

## 5. Fluxuri în aplicație

### Confirmare cont

```text
signUp(emailRedirectTo = {APP_URL}/auth/confirm?next=/dashboard)
→ email (token_hash, type=email)
→ GET /auth/confirm → verifyOtp → cookies sesiune
→ /dashboard (middleware poate trimite la onboarding)
```

### Resetare parolă

```text
resetPasswordForEmail(redirectTo = {APP_URL}/auth/confirm?next=/auth/reset-password)
→ email (token_hash, type=recovery)
→ GET /auth/confirm → verifyOtp → cookies recovery
→ /auth/reset-password → updateUser({ password }) → /login
```

### Rute publice relevante

| Rută | Rol |
|------|-----|
| `/auth/confirm` | `verifyOtp` / fallback PKCE `code` |
| `/auth/callback` | Compatibilitate PKCE (păstrat) |
| `/auth/reset-password` | Formular parolă nouă (necesită sesiune) |
| `/auth/error` | Mesaje prietenoase (`?reason=`) |
| `/auth/forgot-password` | Solicitare link nou |

---

## 6. Checklist după deploy

1. Site URL = `https://easywedd.raianvisual.ro`
2. Redirect URLs includ `/auth/confirm` (și `/**`)
3. Template-urile folosesc `token_hash` + `type` ca mai sus
4. `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` = producție
5. Activează **Confirm email**
6. Testează: signup → email → confirm → dashboard
7. Testează: forgot password → email → reset → login

### Erori frecvente

| Simptom | Cauză tipică |
|---------|----------------|
| `/auth/error?reason=invalid_or_expired_link` | Template greșit, link reutilizat, redirect URL nepermis, sau Site URL greșit |
| Link ajunge pe `/` fără sesiune | Redirect URL lipsă din allow-list; middleware redirecționează `token_hash` către `/auth/confirm` |
| Email netrimis | SMTP / rate limit; vezi Authentication → Logs |

---

## 7. Referințe cod

- `app/auth/confirm/route.ts` — verificare OTP + cookies
- `lib/url.ts` — `getAuthConfirmUrl()`, `getPasswordResetCallbackUrl()`, `getSiteUrl()`
- `lib/actions/auth.ts` — `signUp`, `resetPasswordForEmail`, `updateUser`
- `lib/supabase/middleware.ts` — sesiune + rute publice
