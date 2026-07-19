-- EasyWedd Invitation Studio
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.invitation_project_status as enum (
  'draft', 'published', 'archived'
);

create type public.invitation_template_category as enum (
  'editorial',
  'elegant',
  'minimalist',
  'romantic',
  'botanical',
  'luxury',
  'modern',
  'traditional_romanian',
  'destination_wedding'
);

create type public.invitation_delivery_channel as enum (
  'email', 'link', 'whatsapp_manual', 'qr'
);

create type public.invitation_delivery_status as enum (
  'pending', 'sent', 'failed', 'skipped'
);

create type public.invitation_event_type as enum (
  'open', 'rsvp', 'export', 'email_sent', 'publish'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.invitation_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category public.invitation_template_category not null default 'elegant',
  thumbnail_url text,
  template_schema jsonb not null default '{}'::jsonb,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger invitation_templates_set_updated_at
before update on public.invitation_templates
for each row execute function public.set_updated_at();

create table public.invitation_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  template_id uuid references public.invitation_templates (id) on delete set null,
  status public.invitation_project_status not null default 'draft',
  theme_config jsonb not null default '{}'::jsonb,
  content_config jsonb not null default '{}'::jsonb,
  language text not null default 'ro',
  preview_key text not null default encode(gen_random_bytes(16), 'hex'),
  rsvp_deadline date,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index invitation_projects_workspace_idx on public.invitation_projects (workspace_id);
create index invitation_projects_wedding_idx on public.invitation_projects (wedding_id);

create trigger invitation_projects_set_updated_at
before update on public.invitation_projects
for each row execute function public.set_updated_at();

create table public.invitation_versions (
  id uuid primary key default gen_random_uuid(),
  invitation_project_id uuid not null references public.invitation_projects (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  version_number integer not null,
  content_snapshot jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint invitation_versions_unique unique (invitation_project_id, version_number)
);

create table public.invitation_recipients (
  id uuid primary key default gen_random_uuid(),
  invitation_project_id uuid not null references public.invitation_projects (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  access_token_hash text not null unique,
  opened_at timestamptz,
  last_opened_at timestamptz,
  rsvp_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint invitation_recipients_guest_unique unique (invitation_project_id, guest_id)
);

create index invitation_recipients_project_idx on public.invitation_recipients (invitation_project_id);

create table public.invitation_deliveries (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.invitation_recipients (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  channel public.invitation_delivery_channel not null,
  destination text,
  delivery_status public.invitation_delivery_status not null default 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.invitation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  invitation_project_id uuid not null references public.invitation_projects (id) on delete cascade,
  recipient_id uuid references public.invitation_recipients (id) on delete set null,
  event_type public.invitation_event_type not null,
  device_class text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index invitation_events_project_idx on public.invitation_events (invitation_project_id);

create table public.invitation_rsvp_rate_limits (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  ip_hash text not null,
  window_start timestamptz not null default timezone('utc', now()),
  attempt_count integer not null default 1,
  constraint invitation_rsvp_rate_unique unique (token_hash, ip_hash, window_start)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.invitation_templates enable row level security;
alter table public.invitation_projects enable row level security;
alter table public.invitation_versions enable row level security;
alter table public.invitation_recipients enable row level security;
alter table public.invitation_deliveries enable row level security;
alter table public.invitation_events enable row level security;
alter table public.invitation_rsvp_rate_limits enable row level security;

create policy invitation_templates_select on public.invitation_templates
for select to authenticated
using (is_active = true or public.is_platform_admin());

create policy invitation_templates_admin_write on public.invitation_templates
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy invitation_projects_select on public.invitation_projects
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy invitation_projects_write on public.invitation_projects
for all to authenticated
using (
  public.can_manage_planner(workspace_id)
  or public.has_workspace_role(workspace_id, array['owner','partner','admin']::public.member_role[])
)
with check (
  public.can_manage_planner(workspace_id)
  or public.has_workspace_role(workspace_id, array['owner','partner','admin']::public.member_role[])
);

create policy invitation_versions_select on public.invitation_versions
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy invitation_versions_write on public.invitation_versions
for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy invitation_recipients_select on public.invitation_recipients
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy invitation_recipients_write on public.invitation_recipients
for all to authenticated
using (public.can_manage_guests(workspace_id) or public.can_manage_planner(workspace_id))
with check (public.can_manage_guests(workspace_id) or public.can_manage_planner(workspace_id));

create policy invitation_deliveries_select on public.invitation_deliveries
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy invitation_deliveries_write on public.invitation_deliveries
for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy invitation_events_select on public.invitation_events
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy invitation_events_insert on public.invitation_events
for insert to authenticated
with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

-- rate limits: no direct client access
create policy invitation_rate_limits_deny on public.invitation_rsvp_rate_limits
for all to authenticated
using (false)
with check (false);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.create_invitation_recipient_token(
  p_project_id uuid,
  p_guest_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  proj record;
  raw_token text := encode(gen_random_bytes(32), 'hex');
  hash text := encode(digest(raw_token, 'sha256'), 'hex');
begin
  select * into proj from public.invitation_projects where id = p_project_id;
  if proj is null then raise exception 'project_not_found'; end if;
  if not (public.can_manage_planner(proj.workspace_id) or public.can_manage_guests(proj.workspace_id)) then
    raise exception 'forbidden';
  end if;

  insert into public.invitation_recipients (
    invitation_project_id, workspace_id, guest_id, access_token_hash
  ) values (
    p_project_id, proj.workspace_id, p_guest_id, hash
  )
  on conflict (invitation_project_id, guest_id) do update
  set access_token_hash = excluded.access_token_hash,
      rsvp_completed_at = null,
      opened_at = null,
      last_opened_at = null;

  return raw_token;
end;
$$;

create or replace function public.get_invitation_by_recipient_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  hash text := encode(digest(p_token, 'sha256'), 'hex');
  rec record;
  result jsonb;
begin
  select
    r.id as recipient_id,
    r.guest_id,
    r.rsvp_completed_at,
    p.id as project_id,
    p.workspace_id,
    p.name as project_name,
    p.theme_config,
    p.content_config,
    p.rsvp_deadline,
    p.status,
    g.first_name,
    g.last_name,
    g.rsvp_status,
    g.attendance_count,
    g.children_count,
    g.meal_preference,
    g.allergies,
    g.transport_needed,
    g.accommodation_needed,
    w.couple_name_1,
    w.couple_name_2,
    w.wedding_date
  into rec
  from public.invitation_recipients r
  join public.invitation_projects p on p.id = r.invitation_project_id
  join public.guests g on g.id = r.guest_id
  join public.weddings w on w.id = p.wedding_id
  where r.access_token_hash = hash
  limit 1;

  if rec is null then
    return null;
  end if;

  if rec.status <> 'published' then
    return jsonb_build_object('error', 'not_published');
  end if;

  result := jsonb_build_object(
    'recipient_id', rec.recipient_id,
    'guest_id', rec.guest_id,
    'first_name', rec.first_name,
    'last_name', rec.last_name,
    'rsvp_completed', rec.rsvp_completed_at is not null,
    'rsvp_status', rec.rsvp_status,
    'attendance_count', rec.attendance_count,
    'children_count', rec.children_count,
    'meal_preference', rec.meal_preference,
    'allergies', rec.allergies,
    'transport_needed', rec.transport_needed,
    'accommodation_needed', rec.accommodation_needed,
    'project_id', rec.project_id,
    'project_name', rec.project_name,
    'theme_config', rec.theme_config,
    'content_config', rec.content_config,
    'rsvp_deadline', rec.rsvp_deadline,
    'couple_name_1', rec.couple_name_1,
    'couple_name_2', rec.couple_name_2,
    'wedding_date', rec.wedding_date
  );
  return result;
end;
$$;

create or replace function public.record_invitation_open(
  p_token text,
  p_device_class text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hash text := encode(digest(p_token, 'sha256'), 'hex');
  rec record;
begin
  select r.*, p.workspace_id as ws, p.id as pid
  into rec
  from public.invitation_recipients r
  join public.invitation_projects p on p.id = r.invitation_project_id
  where r.access_token_hash = hash
  limit 1;

  if rec is null then return false; end if;

  update public.invitation_recipients
  set
    opened_at = coalesce(opened_at, timezone('utc', now())),
    last_opened_at = timezone('utc', now())
  where id = rec.id;

  insert into public.invitation_events (
    workspace_id, invitation_project_id, recipient_id, event_type, device_class
  ) values (
    rec.ws, rec.pid, rec.id, 'open', left(coalesce(p_device_class, 'unknown'), 32)
  );

  return true;
end;
$$;

create or replace function public.submit_invitation_rsvp(
  p_token text,
  p_rsvp_status public.guest_rsvp_status,
  p_attendance_count integer,
  p_children_count integer,
  p_meal_preference text default null,
  p_allergies text default null,
  p_transport_needed boolean default false,
  p_accommodation_needed boolean default false,
  p_message text default null,
  p_ip_hash text default 'unknown'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hash text := encode(digest(p_token, 'sha256'), 'hex');
  rec record;
  window_ts timestamptz := date_trunc('hour', timezone('utc', now()));
  attempts integer;
begin
  if p_rsvp_status not in ('confirmed', 'declined', 'maybe') then
    raise exception 'invalid_status';
  end if;

  select r.*, p.workspace_id as ws, p.wedding_id as wid, p.id as pid, p.rsvp_deadline
  into rec
  from public.invitation_recipients r
  join public.invitation_projects p on p.id = r.invitation_project_id
  where r.access_token_hash = hash
  limit 1;

  if rec is null then raise exception 'invalid_token'; end if;
  if rec.rsvp_deadline is not null and rec.rsvp_deadline < current_date then
    raise exception 'deadline_passed';
  end if;

  insert into public.invitation_rsvp_rate_limits (token_hash, ip_hash, window_start, attempt_count)
  values (hash, left(coalesce(p_ip_hash, 'unknown'), 64), window_ts, 1)
  on conflict (token_hash, ip_hash, window_start)
  do update set attempt_count = public.invitation_rsvp_rate_limits.attempt_count + 1
  returning attempt_count into attempts;

  if attempts > 20 then
    raise exception 'rate_limited';
  end if;

  update public.guests
  set
    rsvp_status = p_rsvp_status,
    attendance_count = greatest(coalesce(p_attendance_count, 1), 0),
    children_count = greatest(coalesce(p_children_count, 0), 0),
    meal_preference = p_meal_preference,
    allergies = p_allergies,
    transport_needed = coalesce(p_transport_needed, false),
    accommodation_needed = coalesce(p_accommodation_needed, false),
    updated_at = timezone('utc', now())
  where id = rec.guest_id;

  insert into public.rsvp_responses (
    workspace_id, wedding_id, guest_id, rsvp_status,
    attendance_count, children_count, meal_preference, allergies, message
  ) values (
    rec.ws, rec.wid, rec.guest_id, p_rsvp_status,
    greatest(coalesce(p_attendance_count, 1), 0),
    greatest(coalesce(p_children_count, 0), 0),
    p_meal_preference, p_allergies, p_message
  );

  update public.invitation_recipients
  set rsvp_completed_at = timezone('utc', now())
  where id = rec.id;

  insert into public.invitation_events (
    workspace_id, invitation_project_id, recipient_id, event_type, metadata
  ) values (
    rec.ws, rec.pid, rec.id, 'rsvp',
    jsonb_build_object('status', p_rsvp_status)
  );

  insert into public.audit_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (rec.ws, null, 'invitation.rsvp', 'invitation_recipient', rec.id,
    jsonb_build_object('status', p_rsvp_status));

  return true;
end;
$$;

create or replace function public.get_invitation_preview(
  p_project_id uuid,
  p_preview_key text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  proj record;
begin
  select * into proj
  from public.invitation_projects
  where id = p_project_id and preview_key = p_preview_key
  limit 1;

  if proj is null then return null; end if;

  return jsonb_build_object(
    'project_id', proj.id,
    'name', proj.name,
    'theme_config', proj.theme_config,
    'content_config', proj.content_config,
    'status', proj.status
  );
end;
$$;

revoke all on function public.create_invitation_recipient_token(uuid, uuid) from public;
revoke all on function public.get_invitation_by_recipient_token(text) from public;
revoke all on function public.record_invitation_open(text, text) from public;
revoke all on function public.submit_invitation_rsvp(text, public.guest_rsvp_status, integer, integer, text, text, boolean, boolean, text, text) from public;
revoke all on function public.get_invitation_preview(uuid, text) from public;

grant execute on function public.create_invitation_recipient_token(uuid, uuid) to authenticated;
grant execute on function public.get_invitation_by_recipient_token(text) to anon, authenticated;
grant execute on function public.record_invitation_open(text, text) to anon, authenticated;
grant execute on function public.submit_invitation_rsvp(text, public.guest_rsvp_status, integer, integer, text, text, boolean, boolean, text, text) to anon, authenticated;
grant execute on function public.get_invitation_preview(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed 5 original templates
-- ---------------------------------------------------------------------------
insert into public.invitation_templates (name, slug, category, is_premium, is_active, thumbnail_url, template_schema)
values
(
  'Editorial Ivory',
  'editorial-ivory',
  'editorial',
  false,
  true,
  null,
  '{"sections":["hero","couple","when_where","schedule","party","dress_code","travel","rsvp","footer"],"theme":{"background":"#F7F4EF","foreground":"#2A2420","accent":"#C4A574","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
),
(
  'Elegant Charcoal',
  'elegant-charcoal',
  'elegant',
  false,
  true,
  null,
  '{"sections":["hero","couple","when_where","schedule","party","dress_code","travel","rsvp","footer"],"theme":{"background":"#FFFDF9","foreground":"#2A2420","accent":"#8A7A66","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
),
(
  'Minimal Line',
  'minimal-line',
  'minimalist',
  false,
  true,
  null,
  '{"sections":["hero","couple","when_where","rsvp","footer"],"theme":{"background":"#FFFFFF","foreground":"#1A1A1A","accent":"#2A2420","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
),
(
  'Botanical Soft',
  'botanical-soft',
  'botanical',
  true,
  true,
  null,
  '{"sections":["hero","couple","when_where","schedule","party","dress_code","travel","rsvp","footer"],"theme":{"background":"#F3F6F1","foreground":"#243028","accent":"#6B8F71","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
),
(
  'Tradițional Românesc',
  'traditional-romanian',
  'traditional_romanian',
  true,
  true,
  null,
  '{"sections":["hero","couple","when_where","schedule","party","dress_code","travel","rsvp","footer"],"theme":{"background":"#F8F1E7","foreground":"#3B2A1F","accent":"#A67C52","headingFont":"Cormorant Garamond","bodyFont":"Source Sans 3"}}'::jsonb
);
