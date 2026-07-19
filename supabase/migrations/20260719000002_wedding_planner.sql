-- EasyWedd Wedding Planner module: tasks, budget, guests, seating, vendors, timeline, contacts
-- RLS via existing helpers; no anon SELECT on guest PII

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.task_category as enum (
  'venue', 'photo_video', 'outfits', 'rings', 'ceremony', 'invitations',
  'guests', 'catering', 'music', 'decor', 'transport', 'accommodation',
  'honeymoon', 'legal', 'other'
);

create type public.task_status as enum (
  'todo', 'in_progress', 'waiting', 'done', 'cancelled'
);

create type public.task_priority as enum (
  'low', 'medium', 'high', 'urgent'
);

create type public.task_recurrence as enum (
  'none', 'weekly', 'monthly'
);

create type public.payment_status as enum (
  'unpaid', 'partial', 'paid', 'overdue'
);

create type public.payment_method as enum (
  'cash', 'card', 'transfer', 'other'
);

create type public.guest_side as enum (
  'bride', 'groom', 'both', 'other'
);

create type public.guest_invitation_status as enum (
  'not_sent', 'sent', 'delivered', 'opened'
);

create type public.guest_rsvp_status as enum (
  'pending', 'confirmed', 'declined', 'maybe'
);

create type public.table_shape as enum (
  'round', 'rectangle'
);

create type public.vendor_status as enum (
  'offered', 'contacted', 'shortlist', 'contracted', 'rejected'
);

create type public.timeline_visibility as enum (
  'couple', 'photo_team', 'guests', 'private'
);

create type public.contact_type as enum (
  'parents', 'godparents', 'bridesmaids', 'groomsmen', 'restaurant',
  'dj', 'photo_video', 'transport', 'accommodation', 'emergency', 'other'
);

-- ---------------------------------------------------------------------------
-- Helper: can manage planner data
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_planner(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.has_workspace_role(
      p_workspace_id,
      array['owner', 'partner', 'wedding_planner', 'admin']::public.member_role[]
    );
$$;

create or replace function public.can_manage_guests(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.has_workspace_role(
      p_workspace_id,
      array['owner', 'partner', 'wedding_planner', 'guest_manager', 'admin']::public.member_role[]
    );
$$;

-- ---------------------------------------------------------------------------
-- wedding_tasks
-- ---------------------------------------------------------------------------
create table public.wedding_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  category public.task_category not null default 'other',
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date date,
  completed_at timestamptz,
  assigned_to uuid references public.profiles (id) on delete set null,
  estimated_cost numeric(12, 2),
  actual_cost numeric(12, 2),
  recurrence public.task_recurrence not null default 'none',
  recurrence_parent_id uuid references public.wedding_tasks (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index wedding_tasks_workspace_idx on public.wedding_tasks (workspace_id);
create index wedding_tasks_wedding_idx on public.wedding_tasks (wedding_id);
create index wedding_tasks_status_idx on public.wedding_tasks (status);
create index wedding_tasks_due_date_idx on public.wedding_tasks (due_date);

create trigger wedding_tasks_set_updated_at
before update on public.wedding_tasks
for each row execute function public.set_updated_at();

create table public.wedding_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.wedding_tasks (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index wedding_task_checklist_task_idx on public.wedding_task_checklist_items (task_id);

-- ---------------------------------------------------------------------------
-- Budget
-- ---------------------------------------------------------------------------
create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint budget_categories_unique unique (wedding_id, name)
);

create trigger budget_categories_set_updated_at
before update on public.budget_categories
for each row execute function public.set_updated_at();

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid references public.budget_categories (id) on delete set null,
  name text not null,
  vendor_id uuid,
  estimated_amount numeric(12, 2) not null default 0,
  contracted_amount numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  due_amount numeric(12, 2) not null default 0,
  payment_status public.payment_status not null default 'unpaid',
  currency text not null default 'RON',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index budget_items_wedding_idx on public.budget_items (wedding_id);

create trigger budget_items_set_updated_at
before update on public.budget_items
for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  budget_item_id uuid not null references public.budget_items (id) on delete cascade,
  amount numeric(12, 2) not null,
  payment_date date not null default current_date,
  payment_method public.payment_method not null default 'transfer',
  reference text,
  proof_document_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index payments_budget_item_idx on public.payments (budget_item_id);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  base_currency text not null,
  quote_currency text not null,
  rate numeric(18, 8) not null,
  effective_on date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  constraint exchange_rates_positive check (rate > 0),
  constraint exchange_rates_unique unique (workspace_id, base_currency, quote_currency, effective_on)
);

-- ---------------------------------------------------------------------------
-- Guests
-- ---------------------------------------------------------------------------
create table public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger guest_groups_set_updated_at
before update on public.guest_groups
for each row execute function public.set_updated_at();

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  group_id uuid references public.guest_groups (id) on delete set null,
  first_name text not null,
  last_name text not null default '',
  phone text,
  email text,
  relationship text,
  side public.guest_side not null default 'other',
  invitation_status public.guest_invitation_status not null default 'not_sent',
  rsvp_status public.guest_rsvp_status not null default 'pending',
  attendance_count integer not null default 1,
  children_count integer not null default 0,
  meal_preference text,
  allergies text,
  accommodation_needed boolean not null default false,
  transport_needed boolean not null default false,
  table_id uuid,
  notes text,
  consent_to_contact boolean not null default false,
  is_anonymized boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index guests_wedding_idx on public.guests (wedding_id);
create index guests_rsvp_idx on public.guests (rsvp_status);
create index guests_name_idx on public.guests (wedding_id, lower(last_name), lower(first_name));

create trigger guests_set_updated_at
before update on public.guests
for each row execute function public.set_updated_at();

create table public.guest_companions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  meal_preference text,
  allergies text,
  is_child boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.guest_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  event_key text not null,
  attending boolean,
  created_at timestamptz not null default timezone('utc', now()),
  constraint guest_events_unique unique (guest_id, event_key)
);

create table public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  rsvp_status public.guest_rsvp_status not null,
  attendance_count integer not null default 1,
  children_count integer not null default 0,
  meal_preference text,
  allergies text,
  message text,
  submitted_at timestamptz not null default timezone('utc', now())
);

create table public.rsvp_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index rsvp_tokens_guest_idx on public.rsvp_tokens (guest_id);

-- ---------------------------------------------------------------------------
-- Seating
-- ---------------------------------------------------------------------------
create table public.venue_layouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null default 'Layout principal',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger venue_layouts_set_updated_at
before update on public.venue_layouts
for each row execute function public.set_updated_at();

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  layout_id uuid references public.venue_layouts (id) on delete cascade,
  label text not null,
  shape public.table_shape not null default 'round',
  capacity integer not null default 8,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tables_capacity_positive check (capacity > 0)
);

create trigger tables_set_updated_at
before update on public.tables
for each row execute function public.set_updated_at();

alter table public.guests
  add constraint guests_table_id_fkey
  foreign key (table_id) references public.tables (id) on delete set null;

create table public.table_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  table_id uuid not null references public.tables (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  seat_label text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint table_assignments_guest_unique unique (guest_id)
);

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------
create table public.vendor_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint vendor_categories_unique unique (wedding_id, name)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category text not null default 'other',
  category_id uuid references public.vendor_categories (id) on delete set null,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  website text,
  social_url text,
  quoted_price numeric(12, 2),
  contracted_price numeric(12, 2),
  status public.vendor_status not null default 'offered',
  contract_url text,
  notes text,
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

alter table public.budget_items
  add constraint budget_items_vendor_id_fkey
  foreign key (vendor_id) references public.vendors (id) on delete set null;

create table public.vendor_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  title text not null,
  document_url text not null,
  document_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.vendor_reviews_private (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  rating integer check (rating between 1 and 5),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Timeline
-- ---------------------------------------------------------------------------
create table public.wedding_timeline_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  location text,
  start_time timestamptz,
  end_time timestamptz,
  responsible_person text,
  contact_phone text,
  vendor_id uuid references public.vendors (id) on delete set null,
  notes text,
  visibility public.timeline_visibility not null default 'couple',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger wedding_timeline_items_set_updated_at
before update on public.wedding_timeline_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Contact book
-- ---------------------------------------------------------------------------
create table public.wedding_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  contact_type public.contact_type not null default 'other',
  name text not null,
  role_label text,
  phone text,
  email text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger wedding_contacts_set_updated_at
before update on public.wedding_contacts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed helpers (callable from app)
-- ---------------------------------------------------------------------------
create or replace function public.seed_default_budget_categories(
  p_workspace_id uuid,
  p_wedding_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cats text[] := array[
    'Locație', 'Catering', 'Foto-Video', 'Muzică', 'Decor',
    'Ținute', 'Invitații', 'Transport', 'Cazare', 'Altele'
  ];
  i int;
begin
  if not public.can_manage_planner(p_workspace_id) and not public.is_workspace_owner(p_workspace_id) then
    raise exception 'forbidden';
  end if;

  for i in 1..array_length(cats, 1) loop
    insert into public.budget_categories (workspace_id, wedding_id, name, sort_order)
    values (p_workspace_id, p_wedding_id, cats[i], i)
    on conflict (wedding_id, name) do nothing;
  end loop;
end;
$$;

create or replace function public.seed_wedding_task_template(
  p_workspace_id uuid,
  p_wedding_id uuid,
  p_wedding_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base date := coalesce(p_wedding_date, current_date + 180);
begin
  if not public.can_manage_planner(p_workspace_id) and not public.is_workspace_owner(p_workspace_id) then
    raise exception 'forbidden';
  end if;

  if exists (select 1 from public.wedding_tasks t where t.wedding_id = p_wedding_id limit 1) then
    return;
  end if;

  insert into public.wedding_tasks (workspace_id, wedding_id, title, category, priority, due_date, status)
  values
    (p_workspace_id, p_wedding_id, 'Rezervare locație', 'venue', 'urgent', base - 150, 'todo'),
    (p_workspace_id, p_wedding_id, 'Contract foto-video', 'photo_video', 'high', base - 120, 'todo'),
    (p_workspace_id, p_wedding_id, 'Alegere ținute', 'outfits', 'high', base - 90, 'todo'),
    (p_workspace_id, p_wedding_id, 'Comandă verighete', 'rings', 'medium', base - 60, 'todo'),
    (p_workspace_id, p_wedding_id, 'Program ceremonie', 'ceremony', 'high', base - 45, 'todo'),
    (p_workspace_id, p_wedding_id, 'Trimite invitații', 'invitations', 'high', base - 60, 'todo'),
    (p_workspace_id, p_wedding_id, 'Finalizează lista invitați', 'guests', 'high', base - 75, 'todo'),
    (p_workspace_id, p_wedding_id, 'Confirmă meniu catering', 'catering', 'high', base - 40, 'todo'),
    (p_workspace_id, p_wedding_id, 'Contract muzică / DJ', 'music', 'medium', base - 50, 'todo'),
    (p_workspace_id, p_wedding_id, 'Plan decor', 'decor', 'medium', base - 30, 'todo'),
    (p_workspace_id, p_wedding_id, 'Organizează transport', 'transport', 'medium', base - 20, 'todo'),
    (p_workspace_id, p_wedding_id, 'Cazare invitați', 'accommodation', 'low', base - 35, 'todo'),
    (p_workspace_id, p_wedding_id, 'Rezervare lună de miere', 'honeymoon', 'low', base - 40, 'todo'),
    (p_workspace_id, p_wedding_id, 'Documente legale', 'legal', 'urgent', base - 100, 'todo');
end;
$$;

-- ---------------------------------------------------------------------------
-- RSVP RPCs (no direct anon access to guests)
-- ---------------------------------------------------------------------------
create or replace function public.create_rsvp_token(
  p_guest_id uuid,
  p_expires_days integer default 60
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  raw_token text := encode(gen_random_bytes(32), 'hex');
  hash text := encode(digest(raw_token, 'sha256'), 'hex');
begin
  select * into g from public.guests where id = p_guest_id;
  if g is null then
    raise exception 'guest_not_found';
  end if;

  if not public.can_manage_guests(g.workspace_id) then
    raise exception 'forbidden';
  end if;

  update public.rsvp_tokens
  set revoked_at = timezone('utc', now())
  where guest_id = p_guest_id
    and revoked_at is null
    and used_at is null;

  insert into public.rsvp_tokens (
    workspace_id, wedding_id, guest_id, token_hash, expires_at
  ) values (
    g.workspace_id, g.wedding_id, g.id, hash,
    timezone('utc', now()) + make_interval(days => greatest(p_expires_days, 1))
  );

  return raw_token;
end;
$$;

create or replace function public.get_rsvp_by_token(p_token text)
returns table (
  guest_id uuid,
  first_name text,
  last_name text,
  rsvp_status public.guest_rsvp_status,
  attendance_count integer,
  children_count integer,
  meal_preference text,
  allergies text,
  couple_name_1 text,
  couple_name_2 text,
  wedding_date date,
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  hash text := encode(digest(p_token, 'sha256'), 'hex');
begin
  return query
  select
    g.id,
    g.first_name,
    g.last_name,
    g.rsvp_status,
    g.attendance_count,
    g.children_count,
    g.meal_preference,
    g.allergies,
    w.couple_name_1,
    w.couple_name_2,
    w.wedding_date,
    t.expires_at,
    t.used_at,
    t.revoked_at
  from public.rsvp_tokens t
  join public.guests g on g.id = t.guest_id
  join public.weddings w on w.id = t.wedding_id
  where t.token_hash = hash
  limit 1;
end;
$$;

create or replace function public.submit_rsvp(
  p_token text,
  p_rsvp_status public.guest_rsvp_status,
  p_attendance_count integer,
  p_children_count integer,
  p_meal_preference text default null,
  p_allergies text default null,
  p_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hash text := encode(digest(p_token, 'sha256'), 'hex');
  t record;
begin
  select * into t
  from public.rsvp_tokens
  where token_hash = hash
  limit 1;

  if t is null then
    raise exception 'invalid_token';
  end if;
  if t.revoked_at is not null then
    raise exception 'token_revoked';
  end if;
  if t.expires_at < timezone('utc', now()) then
    raise exception 'token_expired';
  end if;
  if t.used_at is not null then
    raise exception 'token_used';
  end if;
  if p_rsvp_status not in ('confirmed', 'declined', 'maybe') then
    raise exception 'invalid_status';
  end if;

  update public.guests
  set
    rsvp_status = p_rsvp_status,
    attendance_count = greatest(coalesce(p_attendance_count, 1), 0),
    children_count = greatest(coalesce(p_children_count, 0), 0),
    meal_preference = p_meal_preference,
    allergies = p_allergies,
    updated_at = timezone('utc', now())
  where id = t.guest_id;

  insert into public.rsvp_responses (
    workspace_id, wedding_id, guest_id, rsvp_status,
    attendance_count, children_count, meal_preference, allergies, message
  ) values (
    t.workspace_id, t.wedding_id, t.guest_id, p_rsvp_status,
    greatest(coalesce(p_attendance_count, 1), 0),
    greatest(coalesce(p_children_count, 0), 0),
    p_meal_preference, p_allergies, p_message
  );

  update public.rsvp_tokens
  set used_at = timezone('utc', now())
  where id = t.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (
    t.workspace_id, null, 'rsvp.submit', 'guest', t.guest_id,
    jsonb_build_object('status', p_rsvp_status)
  );

  return true;
end;
$$;

create or replace function public.anonymize_guest(p_guest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
begin
  select * into g from public.guests where id = p_guest_id;
  if g is null then
    raise exception 'guest_not_found';
  end if;
  if not public.can_manage_guests(g.workspace_id) then
    raise exception 'forbidden';
  end if;

  update public.guests
  set
    first_name = 'Anonim',
    last_name = left(g.id::text, 8),
    phone = null,
    email = null,
    allergies = null,
    meal_preference = null,
    notes = null,
    relationship = null,
    consent_to_contact = false,
    is_anonymized = true,
    updated_at = timezone('utc', now())
  where id = p_guest_id;

  delete from public.guest_companions where guest_id = p_guest_id;

  update public.rsvp_tokens
  set revoked_at = timezone('utc', now())
  where guest_id = p_guest_id and revoked_at is null;

  insert into public.audit_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (g.workspace_id, auth.uid(), 'guest.anonymize', 'guest', p_guest_id, '{}'::jsonb);

  return true;
end;
$$;

revoke all on function public.create_rsvp_token(uuid, integer) from public;
revoke all on function public.get_rsvp_by_token(text) from public;
revoke all on function public.submit_rsvp(text, public.guest_rsvp_status, integer, integer, text, text, text) from public;
revoke all on function public.anonymize_guest(uuid) from public;
revoke all on function public.seed_default_budget_categories(uuid, uuid) from public;
revoke all on function public.seed_wedding_task_template(uuid, uuid, date) from public;

grant execute on function public.create_rsvp_token(uuid, integer) to authenticated;
grant execute on function public.get_rsvp_by_token(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, public.guest_rsvp_status, integer, integer, text, text, text) to anon, authenticated;
grant execute on function public.anonymize_guest(uuid) to authenticated;
grant execute on function public.seed_default_budget_categories(uuid, uuid) to authenticated;
grant execute on function public.seed_wedding_task_template(uuid, uuid, date) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS enable + policies (pattern)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'wedding_tasks', 'wedding_task_checklist_items',
    'budget_categories', 'budget_items', 'payments', 'exchange_rates',
    'guest_groups', 'guests', 'guest_companions', 'guest_events',
    'rsvp_responses', 'rsvp_tokens',
    'venue_layouts', 'tables', 'table_assignments',
    'vendor_categories', 'vendors', 'vendor_contacts', 'vendor_documents', 'vendor_reviews_private',
    'wedding_timeline_items', 'wedding_contacts'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Generic member SELECT policies
create policy wedding_tasks_select on public.wedding_tasks for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy wedding_tasks_write on public.wedding_tasks for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy wedding_task_checklist_select on public.wedding_task_checklist_items for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy wedding_task_checklist_write on public.wedding_task_checklist_items for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy budget_categories_select on public.budget_categories for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy budget_categories_write on public.budget_categories for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy budget_items_select on public.budget_items for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy budget_items_write on public.budget_items for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy payments_select on public.payments for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy payments_write on public.payments for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy exchange_rates_select on public.exchange_rates for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy exchange_rates_write on public.exchange_rates for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy guest_groups_select on public.guest_groups for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy guest_groups_write on public.guest_groups for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy guests_select on public.guests for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy guests_write on public.guests for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy guest_companions_select on public.guest_companions for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy guest_companions_write on public.guest_companions for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy guest_events_select on public.guest_events for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy guest_events_write on public.guest_events for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy rsvp_responses_select on public.rsvp_responses for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy rsvp_responses_write on public.rsvp_responses for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy rsvp_tokens_select on public.rsvp_tokens for select to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin());
create policy rsvp_tokens_write on public.rsvp_tokens for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy venue_layouts_select on public.venue_layouts for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy venue_layouts_write on public.venue_layouts for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy tables_select on public.tables for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy tables_write on public.tables for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy table_assignments_select on public.table_assignments for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy table_assignments_write on public.table_assignments for all to authenticated
using (public.can_manage_guests(workspace_id))
with check (public.can_manage_guests(workspace_id));

create policy vendor_categories_select on public.vendor_categories for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy vendor_categories_write on public.vendor_categories for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy vendors_select on public.vendors for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy vendors_write on public.vendors for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy vendor_contacts_select on public.vendor_contacts for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy vendor_contacts_write on public.vendor_contacts for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy vendor_documents_select on public.vendor_documents for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy vendor_documents_write on public.vendor_documents for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy vendor_reviews_select on public.vendor_reviews_private for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy vendor_reviews_write on public.vendor_reviews_private for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy timeline_select on public.wedding_timeline_items for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy timeline_write on public.wedding_timeline_items for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));

create policy contacts_select on public.wedding_contacts for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy contacts_write on public.wedding_contacts for all to authenticated
using (public.can_manage_planner(workspace_id))
with check (public.can_manage_planner(workspace_id));
