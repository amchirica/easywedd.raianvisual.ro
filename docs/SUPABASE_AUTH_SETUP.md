# Supabase Auth Setup — EasyWedd (plan Free)

Pe **plan Free** nu e nevoie să modifici template-urile email.
Lasă template-urile implicite cu `{{ .ConfirmationURL }}`.

Flux:

```text
signUp / resetPasswordForEmail
  → emailRedirectTo / redirectTo = /auth/confirm?next=…
  → email (ConfirmationURL = acel URL + ?code=…)
  → GET /auth/confirm
  → exchangeCodeForSession(code)   [sau verifyOtp dacă ai TokenHash]
  → cookies + redirect la next
```

---

## 1. URL Configuration (OBLIGATORIU)

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

Fără aceste URL-uri, ConfirmationURL e respins → `invalid_or_expired_link`.

---

## 2. Email Templates

### Plan Free (recomandat acum)

**Nu schimba nimic.** Păstrează linkul implicit:

```html
<a href="{{ .ConfirmationURL }}">…</a>
```

Aplicația setează deja:
- signup → `https://easywedd.raianvisual.ro/auth/confirm?next=/dashboard`
- reset → `https://easywedd.raianvisual.ro/auth/confirm?next=/auth/reset-password`

Supabase adaugă `?code=…` pe ConfirmationURL.

### Dacă mai târziu poți edita template-uri (opțional)

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">
  Confirmă contul
</a>
```

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password">
  Resetează parola
</a>
```

---

## 3. Providers → Email

- Confirm email: **ON** (după deploy + Redirect URLs)

---

## 4. Cloudflare Variables

```text
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
```

---

## 5. URL-uri finale (Free / ConfirmationURL)

| Flux | ConfirmationURL (aprox.) | După confirm |
|------|--------------------------|--------------|
| Signup | `/auth/confirm?next=/dashboard&code=…` | `/dashboard` |
| Reset | `/auth/confirm?next=/auth/reset-password&code=…` | `/auth/reset-password` |

---

## 6. Checklist

1. `npm run deploy`
2. Redirect URLs ca mai sus (inclusiv `/auth/confirm`)
3. Template-uri = implicite (`ConfirmationURL`) — **nu le modifica**
4. Confirm email ON
5. Test cu **email nou**

SMTP custom **nu** e obligatoriu pe Free pentru a repara linkurile.
