# Invitation Studio — limitări V1

## Editor

- Editor **pe secțiuni** (config JSON), nu drag liber pe canvas tip Canva.
- Secțiuni: hero, couple, when_where, schedule, party, dress_code, travel, rsvp, footer.
- Fonturi din listă controlată (`lib/invitations/fonts.ts`).
- Autosave debounce pe `theme_config` / `content_config`; snapshot în `invitation_versions` la Publish.

## Export

- PNG/JPG via `html-to-image` (client-side).
- PDF via `jspdf` — doar plan Premium+ / Pro.
- Viewport-uri fixe: Story 1080×1920, Square 1080×1080, Desktop.
- Calitate bună pentru social/print domestic; nu tipografie offset profesională.

## Distribuire & RSVP

- Link recipient `/i/[token]` (token 32 bytes hex, stocat sha256).
- Preview share `/i/p/[projectId]?k=preview_key`.
- Email transactional 1:1 (Resend; noop fără chei).
- WhatsApp doar `wa.me` manual — **fără** WhatsApp Business API / bulk.
- RSVP scrie în `guests` + `rsvp_responses` și marchează `invitation_recipients.rsvp_completed_at`.

## Planuri

| Tier | Proiecte | RSVP | Watermark | PDF |
|------|----------|------|-----------|-----|
| Starter (`trial`/`starter`) | 1 | 50 | da | nu |
| Premium (`essentials`/`premium`) | 3 | 500 | nu | da |
| Pro (`agency`) | 50 | 5000 | nu | da + multi-export |

- Custom domain: flag UI „pregătit” pe Pro; **fără** provisioning DNS în V1.

## Admin templates

- CRUD în `/admin/templates`.
- Thumbnail = URL text; Storage upload UI minimal / pregătit.

## Securitate

- Acces public doar prin RPC security definer.
- `robots: noindex` pe `/i/*`.
- Rate limit RSVP pe token + IP hash (max 20/oră).
- Sanitize string (strip tags) server-side.

## Teste

- Unit: `lib/invitations/__tests__/plan-limits.test.ts`, `schema.test.ts`.
- Flow RSVP E2E: manual pe `/i/[token]` după publish + recipient token.
