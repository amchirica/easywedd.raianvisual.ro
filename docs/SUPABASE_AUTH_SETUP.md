# Supabase Auth Setup — EasyWedd

## De ce apare `pkce_code_verifier_not_found`

Template-ul implicit `{{ .ConfirmationURL }}` trimite `?code=` (PKCE).  
Verifier-ul e doar în browserul unde ai făcut signup.  
Din Gmail / Safari → **pkce_code_verifier_not_found**.

Pe proiectele Free noi, Supabase **nu lasă editarea template-urilor** până activezi **Custom SMTP**:

> Set up custom SMTP to edit templates

---

## Pasul 0 — Activează Custom SMTP cu Resend (obligatoriu)

Ai deja Resend în Cloudflare (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).

**Authentication → Emails → SMTP Settings**

| Câmp | Valoare |
|------|---------|
| Enable custom SMTP | **ON** |
| Sender email | `notifications@easywedd.raianvisual.ro` |
| Sender name | `EasyWedd` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API key-ul din Resend (același ca `RESEND_API_KEY`) |
| Minimum interval | `60` |

Salvează.

**Condiții Resend:**
- domeniul `easywedd.raianvisual.ro` (sau domeniul din FROM) trebuie verificat în Resend
- nu folosi Yahoo ca SMTP host

După SMTP activ, tab-ul **Templates** se deblochează.

---

## 1. URL Configuration

**Site URL**
```text
https://easywedd.raianvisual.ro
```

**Redirect URLs**
```text
https://easywedd.raianvisual.ro/**
https://easywedd.raianvisual.ro/auth/confirm
https://easywedd.raianvisual.ro/auth/reset-password
http://localhost:3000/**
http://localhost:3000/auth/confirm
http://localhost:3000/auth/reset-password
```

---

## 2. Email Templates (după SMTP)

**Authentication → Emails → Templates**

### Confirm signup

```html
<h2>Confirmă contul EasyWedd</h2>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">
    Confirmă contul
  </a>
</p>
```

### Reset password

```html
<h2>Resetare parolă EasyWedd</h2>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password">
    Resetează parola
  </a>
</p>
```

### Invite user

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/dashboard">
  Acceptă invitația
</a>
```

### Magic link

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard">
  Autentifică-te
</a>
```

### Șterge din template-uri

- `{{ .ConfirmationURL }}`
- orice `code=`
- linkuri `/auth/callback`
- `localhost`

---

## 3. Providers → Email

Confirm email: **ON**

---

## 4. Cloudflare

```text
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
```

---

## 5. Flux app

```text
Email (token_hash)
  → /auth/confirm
  → verifyOtp
  → /dashboard sau /auth/reset-password
```

`/auth/callback` = doar OAuth.

---

## 6. Checklist

1. SMTP Resend ON + Save  
2. Templates TokenHash salvate  
3. Redirect URLs ok  
4. `npm run deploy`  
5. Test cu **email nou** — linkul trebuie să aibă `token_hash=` și **nu** `code=`
