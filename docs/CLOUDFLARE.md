# Deploy Cloudflare Workers (OpenNext)

Worker name (peste tot): **`easywedd-raianvisual`**

## Cauza erorii 520 / "malformed response"

```text
GET /accounts/.../workers/services/easywedd-raianvisual → 520
Received a malformed response from the API
```

Wrangler validează binding-ul `WORKER_SELF_REFERENCE` prin API-ul **Workers Services**.  
Când acel endpoint returnează 520 (HTML / empty), deploy-ul pică **după** build OpenNext reușit.

**Nu e o problemă de build Next.js.** E API Cloudflare sau token expirat.

### Workaround în proiect

`npm run cf:deploy` (= `scripts/cf-deploy.mjs`):

1. Încearcă `wrangler.jsonc` (cu `WORKER_SELF_REFERENCE`)
2. Dacă pică → `wrangler.emergency.jsonc` (fără self-service) ca să ajungă auth-ul în producție

Restaurare binding după ce API-ul e sănătos:

```bash
npx wrangler deploy --config wrangler.jsonc
```

---

## Deploy local (interactiv)

```bash
npx wrangler login
npm install
npm run cf:deploy
```

## Setări Build Dashboard

```text
Build command:  npm run cf:build
Deploy command: npx wrangler deploy --config wrangler.jsonc
```

Sau un singur pas:

```text
Build command:  true
Deploy command: npm run cf:deploy
```

În `wrangler.jsonc`: `minify: true` (Workers Free ≤ 3 MiB gzip).

## Nume Worker

| Loc | Valoare |
|-----|---------|
| `wrangler.jsonc` `name` | `easywedd-raianvisual` |
| `WORKER_SELF_REFERENCE.service` | `easywedd-raianvisual` |
| Dashboard Worker | `easywedd-raianvisual` |

Nu redenumi fără update Dashboard + domenii.

## `middleware.ts` vs `proxy.ts`

**Păstrează `middleware.ts`.** OpenNext 1.20 + `proxy.ts` →  
`ERROR Node.js middleware is not currently supported.`

## Versiuni țintă

- `@opennextjs/cloudflare` ^1.20.2
- `wrangler` ^4.117.0
- `next` 16.2.12

## Secrets producție

```text
Workers → easywedd-raianvisual → Settings → Variables and Secrets
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   (Secret)
```
