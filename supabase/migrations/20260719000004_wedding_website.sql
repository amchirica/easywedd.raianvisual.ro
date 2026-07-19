-- EasyWedd Wedding Website Builder
create extension if not exists "pgcrypto";

create type public.wedding_site_status as enum ('draft', 'published', 'unpublished', 'archived');
create type public.wedding_site_domain_status as enum ('none', 'pending', 'verified', 'failed');
create type public.wedding_site_page_type as enum ('home', 'story', 'schedule', 'gallery', 'rsvp', 'travel', 'faq', 'custom');
create type public.wedding_site_section_type as enum (
  'hero', 'story', 'countdown', 'schedule', 'locations', 'map', 'gallery',
  'dress_code', 'rsvp', 'family', 'team', 'transport', 'accommodation',
  'faq', 'playlist', 'gifts', 'contact', 'guestbook'
);
create type public.wedding_site_visibility as enum ('public', 'unlisted', 'private');

create table public.wedding_site_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  template_schema jsonb not null default '{}'::jsonb,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger wedding_site_templates_set_updated_at
before update on public.wedding_site_templates
for each row execute function public.set_updated_at();

create table public.wedding_sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  slug text not null unique,
  custom_domain text,
  domain_status public.wedding_site_domain_status not null default 'none',
  template_id uuid references public.wedding_site_templates (id) on delete set null,
  status public.wedding_site_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  social_image_url text,
  password_protected boolean not null default false,
  access_password_hash text,
  analytics_enabled boolean not null default true,
  theme_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index wedding_sites_workspace_idx on public.wedding_sites (workspace_id);
create index wedding_sites_wedding_idx on public.wedding_sites (wedding_id);

create trigger wedding_sites_set_updated_at
before update on public.wedding_sites
for each row execute function public.set_updated_at();

create table public.wedding_site_pages (
  id uuid primary key default gen_random_uuid(),
  wedding_site_id uuid not null references public.wedding_sites (id) on delete cascade,
  page_type public.wedding_site_page_type not null default 'home',
  title text not null,
  slug text not null,
  content jsonb not null default '{}'::jsonb,
  visibility public.wedding_site_visibility not null default 'public',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wedding_site_pages_slug_unique unique (wedding_site_id, slug)
);

create trigger wedding_site_pages_set_updated_at
before update on public.wedding_site_pages
for each row execute function public.set_updated_at();

create table public.wedding_site_sections (
  id uuid primary key default gen_random_uuid(),
  wedding_site_id uuid not null references public.wedding_sites (id) on delete cascade,
  page_id uuid references public.wedding_site_pages (id) on delete cascade,
  section_type public.wedding_site_section_type not null,
  section_config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index wedding_site_sections_site_idx on public.wedding_site_sections (wedding_site_id);

create trigger wedding_site_sections_set_updated_at
before update on public.wedding_site_sections
for each row execute function public.set_updated_at();

create table public.wedding_site_media (
  id uuid primary key default gen_random_uuid(),
  wedding_site_id uuid not null references public.wedding_sites (id) on delete cascade,
  media_type text not null default 'image',
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.wedding_site_versions (
  id uuid primary key default gen_random_uuid(),
  wedding_site_id uuid not null references public.wedding_sites (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  version_number integer not null,
  content_snapshot jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint wedding_site_versions_unique unique (wedding_site_id, version_number)
);

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  wedding_site_id uuid not null references public.wedding_sites (id) on delete cascade,
  visitor_session_id text not null,
  page_path text not null default '/',
  referrer_domain text,
  device_type text,
  country_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create index site_visits_site_idx on public.site_visits (wedding_site_id, created_at desc);

-- RLS
alter table public.wedding_site_templates enable row level security;
alter table public.wedding_sites enable row level security;
alter table public.wedding_site_pages enable row level security;
alter table public.wedding_site_sections enable row level security;
alter table public.wedding_site_media enable row level security;
alter table public.wedding_site_versions enable row level security;
alter table public.site_visits enable row level security;

create policy wedding_site_templates_select on public.wedding_site_templates
for select to authenticated
using (is_active = true or public.is_platform_admin());

create policy wedding_site_templates_admin on public.wedding_site_templates
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy wedding_sites_select on public.wedding_sites
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy wedding_sites_write on public.wedding_sites
for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy wedding_site_pages_all on public.wedding_site_pages
for all to authenticated
using (
  exists (
    select 1 from public.wedding_sites s
    where s.id = wedding_site_id and public.is_workspace_member(s.workspace_id)
  )
)
with check (
  exists (
    select 1 from public.wedding_sites s
    where s.id = wedding_site_id and public.can_manage_planner(s.workspace_id)
  )
);

create policy wedding_site_sections_all on public.wedding_site_sections
for all to authenticated
using (
  exists (
    select 1 from public.wedding_sites s
    where s.id = wedding_site_id and public.is_workspace_member(s.workspace_id)
  )
)
with check (
  exists (
    select 1 from public.wedding_sites s
    where s.id = wedding_site_id and public.can_manage_planner(s.workspace_id)
  )
);

create policy wedding_site_media_all on public.wedding_site_media
for all to authenticated
using (
  exists (
    select 1 from public.wedding_sites s
    where s.id = wedding_site_id and public.is_workspace_member(s.workspace_id)
  )
)
with check (
  exists (
    select 1 from public.wedding_sites s
    where s.id = wedding_site_id and public.can_manage_planner(s.workspace_id)
  )
);

create policy wedding_site_versions_select on public.wedding_site_versions
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy wedding_site_versions_write on public.wedding_site_versions
for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy site_visits_select on public.site_visits
for select to authenticated
using (
  exists (
    select 1 from public.wedding_sites s
    where s.id = wedding_site_id and public.is_workspace_member(s.workspace_id)
  )
  or public.is_platform_admin()
);

-- Public RPCs (no anon table policies)
create or replace function public.get_public_wedding_site(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  site record;
  pages jsonb;
  sections jsonb;
begin
  select * into site
  from public.wedding_sites
  where slug = lower(trim(p_slug))
    and status = 'published'
  limit 1;

  if site is null then
    return null;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'page_type', p.page_type,
      'title', p.title,
      'slug', p.slug,
      'content', p.content,
      'visibility', p.visibility,
      'sort_order', p.sort_order
    ) order by p.sort_order
  ), '[]'::jsonb)
  into pages
  from public.wedding_site_pages p
  where p.wedding_site_id = site.id
    and p.visibility = 'public';

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'page_id', s.page_id,
      'section_type', s.section_type,
      'section_config', s.section_config,
      'sort_order', s.sort_order,
      'is_visible', s.is_visible
    ) order by s.sort_order
  ), '[]'::jsonb)
  into sections
  from public.wedding_site_sections s
  where s.wedding_site_id = site.id
    and s.is_visible = true;

  return jsonb_build_object(
    'id', site.id,
    'slug', site.slug,
    'seo_title', site.seo_title,
    'seo_description', site.seo_description,
    'social_image_url', site.social_image_url,
    'password_protected', site.password_protected,
    'theme_config', site.theme_config,
    'analytics_enabled', site.analytics_enabled,
    'pages', pages,
    'sections', sections
  );
end;
$$;

create or replace function public.record_site_visit(
  p_slug text,
  p_visitor_session_id text,
  p_page_path text default '/',
  p_referrer_domain text default null,
  p_device_type text default null,
  p_country_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  site_id uuid;
begin
  select id into site_id
  from public.wedding_sites
  where slug = lower(trim(p_slug))
    and status = 'published'
    and analytics_enabled = true
  limit 1;

  if site_id is null then
    return false;
  end if;

  insert into public.site_visits (
    wedding_site_id, visitor_session_id, page_path,
    referrer_domain, device_type, country_code
  ) values (
    site_id,
    left(coalesce(p_visitor_session_id, 'anon'), 64),
    left(coalesce(p_page_path, '/'), 200),
    left(p_referrer_domain, 120),
    left(p_device_type, 32),
    left(p_country_code, 8)
  );

  return true;
end;
$$;

create or replace function public.verify_wedding_site_password(
  p_slug text,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  site record;
  hash text;
begin
  select * into site from public.wedding_sites
  where slug = lower(trim(p_slug)) and status = 'published'
  limit 1;

  if site is null then return false; end if;
  if not site.password_protected then return true; end if;

  hash := encode(digest(p_password, 'sha256'), 'hex');
  return site.access_password_hash = hash;
end;
$$;

revoke all on function public.get_public_wedding_site(text) from public;
revoke all on function public.record_site_visit(text, text, text, text, text, text) from public;
revoke all on function public.verify_wedding_site_password(text, text) from public;

grant execute on function public.get_public_wedding_site(text) to anon, authenticated;
grant execute on function public.record_site_visit(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.verify_wedding_site_password(text, text) to anon, authenticated;

-- Seed templates
insert into public.wedding_site_templates (name, slug, is_premium, template_schema) values
(
  'Ivory Classic',
  'ivory-classic',
  false,
  '{"sections":["hero","story","countdown","schedule","locations","rsvp","family","faq","contact"],"theme":{"background":"#F7F4EF","foreground":"#2A2420","accent":"#C4A574","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
),
(
  'Minimal Light',
  'minimal-light',
  false,
  '{"sections":["hero","story","schedule","locations","gallery","rsvp","contact"],"theme":{"background":"#FFFFFF","foreground":"#1A1A1A","accent":"#2A2420","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
),
(
  'Garden Soft',
  'garden-soft',
  true,
  '{"sections":["hero","story","countdown","schedule","locations","map","gallery","dress_code","rsvp","family","transport","accommodation","faq","gifts","contact","guestbook"],"theme":{"background":"#F3F6F1","foreground":"#243028","accent":"#6B8F71","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
);
