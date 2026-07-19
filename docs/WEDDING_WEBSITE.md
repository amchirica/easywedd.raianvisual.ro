# Wedding Website Builder

## Public URL

- MVP: `https://easywedd.raianvisual.ro/w/{slug}`
- Subdomain / custom domain: pregătite ca stare (`domain_status`), fără DNS live

## Editor

- Secțiuni + DnD reorder (`@dnd-kit`)
- Autosave theme + section_config
- Publish creează version snapshot
- RSVP pe site = link către `/rsvp` sau `/i` (nu duplică modelul guests)

## SEO

- seo_title / seo_description / social_image_url
- Open Graph + canonical pe `/w/[slug]`
- `noindex` dacă password_protected
- Sitemap: `/sitemap-weddings.xml` (doar published publice)
