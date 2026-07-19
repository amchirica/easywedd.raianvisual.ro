# Custom domains (MVP)

## Stare în DB

`wedding_sites.custom_domain` + `domain_status`:

| Status | Semnificație |
|--------|----------------|
| `none` | Fără domeniu |
| `pending` | Dominiu introdus, așteaptă verificare DNS |
| `verified` | Pregătit pentru routing (viitor) |
| `failed` | Verificare eșuată |

## Ce face MVP

- UI setări pentru domeniu
- Documentație pentru client: CNAME către EasyWedd
- Fără provisioning automat (Vercel/Cloudflare API)

## Pași viitori

1. Verificare TXT/CNAME
2. Emitere certificat TLS
3. Routing host-based către `wedding_sites.slug`
