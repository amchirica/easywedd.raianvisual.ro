-- Advanced invitation template with full section set (no table schema change — jsonb only)
insert into public.invitation_templates (name, slug, category, is_premium, is_active, thumbnail_url, template_schema)
values (
  'Editorial Complet',
  'editorial-complet',
  'editorial',
  false,
  true,
  null,
  '{
    "sections": [
      "hero",
      "announcement",
      "couple",
      "story",
      "countdown",
      "when_where",
      "timeline",
      "gallery",
      "dress_code",
      "accommodation",
      "transport",
      "gifts",
      "faq",
      "rsvp",
      "footer"
    ],
    "theme": {
      "background": "#F7F4EF",
      "foreground": "#2A2420",
      "accent": "#C4A574",
      "headingFont": "Cormorant Garamond",
      "bodyFont": "Source Sans 3"
    }
  }'::jsonb
)
on conflict (slug) do update set
  template_schema = excluded.template_schema,
  is_active = true,
  updated_at = timezone('utc', now());
