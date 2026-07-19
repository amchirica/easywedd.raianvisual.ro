# Deploy Cloudflare Workers (OpenNext)

## Setări Build (obligatoriu)

În Cloudflare Dashboard → Worker `easywedd-raianvisual` → Settings → Builds:

```text
Build command:
npm run cf:build

Deploy command:
npx wrangler deploy
```

În `wrangler.jsonc` este setat `minify: true` (necesar pe plan Free — limita gzip Worker = 3 MiB).

### Eroare 10027 — Worker > 3 MiB

Log tipic:

```text
Your Worker exceeded the size limit of 3 MiB. Please upgrade to a paid plan
[code: 10027]
Total Upload: … / gzip: ~3198 KiB
```

- Contul Cloudflare e pe **Workers Free** (max **3 MiB** gzip). Paid = până la **10 MiB**.
- Upload-ul anterior era ~126 KiB peste limită; minify + bundle mai mic ar trebui să treacă.
- Verificare locală după build: `npm run cf:size` (dry-run; uită-te la linia `gzip:`).
- Dacă tot ești peste 3 MiB: [Workers Paid](https://dash.cloudflare.com/?to=/:account/workers/plans).

### De ce eșuează `npm run build` + `npx wrangler deploy`

Log tipic:

```text
Executing user build command: npm run build   → doar next build
Executing user deploy command: npx wrangler deploy
OpenNext project detected, calling opennextjs-cloudflare deploy
ERROR Could not find compiled Open Next config, did you run the build command?
```

- `npm run build` = `next build` → produce `.next/`, **nu** `.open-next/`
- `npx wrangler deploy` detectează OpenNext și cere output-ul din `opennextjs-cloudflare build` (`.open-next/`)

Folosește întotdeauna `npm run cf:build` ca Build command.

### Alternativă (un singur pas pe deploy)

```text
Build command:
true

Deploy command:
npm run deploy
```

(`npm run deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`)

## Cauza erorii 10143 (Worker name)

Autoconfigurarea a generat `easyweddraianvisualro` din `package.json` name.
Worker-ul real: `easywedd-raianvisual` — vezi `wrangler.jsonc`.

## Configurație versionată

- `wrangler.jsonc` — `"name": "easywedd-raianvisual"`
- `WORKER_SELF_REFERENCE.service` — același nume
- `open-next.config.ts`
- Nu rula migrate/autoconfig pe CI; fișierele sunt deja în repo

## `middleware.ts` vs `proxy.ts` (Next 16)

Next 16 afișează:

```text
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**Nu migra la `proxy.ts` încă.** Cu `@opennextjs/cloudflare@1.20.1`, `proxy.ts`
este tratat ca Node middleware și build-ul eșuează cu:

```text
ERROR Node.js middleware is not currently supported.
```

Păstrează `middleware.ts` (Edge) până când OpenNext suportă oficial `proxy`.

## Secrets / Variables producție

Nu folosi `.dev.vars` în producție.

```text
Workers & Pages → easywedd-raianvisual → Settings → Variables and Secrets
```

Obligatoriu:

```text
NEXT_PUBLIC_SITE_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_APP_URL=https://easywedd.raianvisual.ro
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   (tip Secret)
```

`.dev.vars` este gitignored; local: `.dev.vars.example`. Detalii: `docs/ENV.md`.
