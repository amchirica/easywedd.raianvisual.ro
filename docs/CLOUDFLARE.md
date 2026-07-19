# Deploy Cloudflare Workers (OpenNext)

## Setări Build (obligatoriu)

În Cloudflare Dashboard → Worker `easywedd-raianvisual` → Settings → Builds:

```text
Build command:
npm run cf:build

Deploy command:
npx wrangler deploy
```

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

## Secrets producție

Nu folosi `.dev.vars` în producție.

```text
Workers & Pages → easywedd-raianvisual → Settings → Variables and Secrets
```

`.dev.vars` este gitignored; local: `.dev.vars.example`.
