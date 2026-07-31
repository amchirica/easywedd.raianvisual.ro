# Supabase Auth Setup — EasyWedd

## De ce apare `pkce_code_verifier_not_found`

Template-ul implicit `{{ .ConfirmationURL }}` trimite `?code=` (PKCE).  
Verifier-ul e salvat în browserul unde ai făcut signup.  
Din Gmail / Safari / in-app browser **nu există** → eroare.

**Soluție obligatorie:** template-uri cu `token_hash` + `verifyOtp` pe `/auth/confirm`.  
Asta funcționează în orice browser.

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

## 2. Email Templates (OBLIGATORIU — fără ConfirmationURL)

Mergi la: **Authentication → Emails → Templates**  
(nu SMTP Settings). Pe plan Free template-urile se pot edita.

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

### Elimină din toate template-urile

- `{{ .ConfirmationURL }}`
- `code=`
- linkuri către `/auth/callback`
- `localhost`

---

## 3. Providers → Email

Confirm email: **ON**

---

## 4. Variabile Cloudflare

```text
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
```

---

## 5. Flux în aplicație

```text
Email (token_hash)
  → GET /auth/confirm
  → verifyOtp({ token_hash, type })
  → cookies sesiune
  → /dashboard  SAU  /auth/reset-password
```

`/auth/callback` + `exchangeCodeForSession` = **doar OAuth** (dacă există).

---

## 6. Dacă Dashboard-ul Templates crapă

1. Alt browser / Incognito  
2. Authentication → Emails → **Templates** (nu SMTP)  
3. Salvează câte un template pe rând  

Linkul din emailul nou trebuie să conțină `token_hash=` și **nu** `code=`.

---

## 7. Checklist

1. `npm run deploy`  
2. Template-uri TokenHash salvate  
3. Redirect URLs ok  
4. Confirm email ON  
5. Test cu **email nou** (linkurile vechi cu `code=` vor eșua intenționat)
