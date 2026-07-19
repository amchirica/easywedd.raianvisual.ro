# Deploy Cloudflare Workers (OpenNext)

## Cauza erorii 10143

Autoconfigurarea Wrangler/OpenNext a generat:

```text
WORKER_SELF_REFERENCE → service: easyweddraianvisualro
```

din `package.json` `"name": "easywedd.raianvisual.ro"` (punctele eliminate).

Worker-ul real din Dashboard este:

```text
easywedd-raianvisual
```

## Configurație versionată

- `wrangler.jsonc` — `"name": "easywedd-raianvisual"`
- `services[0].service` — exact același nume
- `open-next.config.ts` — adapter OpenNext
- Nu rulați `npx wrangler deploy` pe un proiect fără aceste fișiere (declanșează migrate/autoconfig).

## Cloudflare Build Settings (recomandat)

```text
Build command:
npm run cf:build

Deploy command:
npx wrangler deploy
```

Alternativ (build + deploy într-un singur pas pe deploy):

```text
Build command:
npm run build

Deploy command:
npm run deploy
```

Evită: `next build` → autoconfig OpenNext → încă un `next build`.

## Secrets producție

Nu folosi `.dev.vars` în producție. Configurează în:

```text
Workers & Pages → easywedd-raianvisual → Settings → Variables and Secrets
```

`.dev.vars` este în `.gitignore`. Folosește `.dev.vars.example` local.

## Verificare Worker

Dashboard → Workers & Pages → Workers → nume exact `easywedd-raianvisual`.
Nu redenumi fără a actualiza domeniul custom și `wrangler.jsonc`.
