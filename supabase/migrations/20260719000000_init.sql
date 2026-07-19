-- EasyWedd foundation schema: multi-tenancy, consents, entitlements, RLS
-- Apply via Supabase SQL Editor or `supabase db push`

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.workspace_type as enum (
  'couple',
  'raian_client',
  'professional',
  'agency',
  'admin'
);

create type public.member_role as enum (
  'owner',
  'partner',
  'collaborator',
  'wedding_planner',
  'photographer',
  'videographer',
  'guest_manager',
  'admin'
);

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'declined',
  'revoked'
);

create type public.workspace_status as enum (
  'active',
  'onboarding',
  'suspended',
  'archived'
);

create type public.wedding_status as enum (
  'planning',
  'confirmed',
  'completed',
  'cancelled'
);

create type public.subscription_plan as enum (
  'trial',
  'starter',
  'essentials',
  'premium',
  'agency'
);

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete'
);

create type public.consent_type as enum (
  'terms',
  'privacy',
  'marketing',
  'analytics',
  'anonymized_industry_research'
);

-- ---------------------------------------------------------------------------
-- Updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  locale text not null default 'ro',
  timezone text not null default 'Europe/Bucharest',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  workspace_type public.workspace_type not null default 'couple',
  owner_id uuid not null references public.profiles (id) on delete restrict,
  status public.workspace_status not null default 'onboarding',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index workspaces_owner_id_idx on public.workspaces (owner_id);
create index workspaces_slug_idx on public.workspaces (slug);

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------------
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  role public.member_role not null default 'collaborator',
  invited_by uuid references public.profiles (id) on delete set null,
  invitation_status public.invitation_status not null default 'pending',
  invite_email text,
  invite_token text unique,
  created_at timestamptz not null default timezone('utc', now()),
  constraint workspace_members_user_or_email check (
    user_id is not null or invite_email is not null
  ),
  constraint workspace_members_unique_user unique (workspace_id, user_id)
);

create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_invite_token_idx on public.workspace_members (invite_token);

-- ---------------------------------------------------------------------------
-- weddings
-- ---------------------------------------------------------------------------
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  couple_name_1 text,
  couple_name_2 text,
  wedding_date date,
  civil_ceremony_date date,
  religious_ceremony_date date,
  city text,
  venue_name text,
  estimated_guest_count integer,
  currency text not null default 'RON',
  wedding_status public.wedding_status not null default 'planning',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index weddings_workspace_id_idx on public.weddings (workspace_id);

create trigger weddings_set_updated_at
before update on public.weddings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  plan public.subscription_plan not null default 'trial',
  status public.subscription_status not null default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index subscriptions_workspace_id_idx on public.subscriptions (workspace_id);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- feature_entitlements
-- ---------------------------------------------------------------------------
create table public.feature_entitlements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  usage_limit integer,
  usage_value integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint feature_entitlements_unique unique (workspace_id, feature_key)
);

create index feature_entitlements_workspace_id_idx on public.feature_entitlements (workspace_id);

create trigger feature_entitlements_set_updated_at
before update on public.feature_entitlements
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_logs_workspace_id_idx on public.audit_logs (workspace_id);
create index audit_logs_user_id_idx on public.audit_logs (user_id);

-- ---------------------------------------------------------------------------
-- user_consents
-- ---------------------------------------------------------------------------
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  consent_type public.consent_type not null,
  consent_version text not null,
  granted boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  source text not null default 'app',
  created_at timestamptz not null default timezone('utc', now())
);

create index user_consents_user_id_idx on public.user_consents (user_id);
create index user_consents_workspace_id_idx on public.user_consents (workspace_id);

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer to avoid recursive policy checks)
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.invitation_status = 'accepted'
  );
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(
  p_workspace_id uuid,
  p_roles public.member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.invitation_status = 'accepted'
      and wm.role = any (p_roles)
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.user_id = auth.uid()
      and wm.invitation_status = 'accepted'
      and wm.role = 'admin'
      and w.workspace_type = 'admin'
      and w.status = 'active'
  );
$$;

create or replace function public.shares_workspace_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members me
    join public.workspace_members other
      on other.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and me.invitation_status = 'accepted'
      and other.user_id = p_user_id
      and other.invitation_status = 'accepted'
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.weddings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.feature_entitlements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_consents enable row level security;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_shared"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.shares_workspace_with(id)
  or public.is_platform_admin()
);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- workspaces policies
-- ---------------------------------------------------------------------------
create policy "workspaces_select_member_or_admin"
on public.workspaces for select
to authenticated
using (
  public.is_workspace_member(id)
  or public.is_platform_admin()
);

create policy "workspaces_insert_authenticated"
on public.workspaces for insert
to authenticated
with check (owner_id = auth.uid());

create policy "workspaces_update_owner_or_admin"
on public.workspaces for update
to authenticated
using (
  public.is_workspace_owner(id)
  or public.has_workspace_role(id, array['admin', 'partner']::public.member_role[])
  or public.is_platform_admin()
)
with check (
  public.is_workspace_owner(id)
  or public.has_workspace_role(id, array['admin', 'partner']::public.member_role[])
  or public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- workspace_members policies
-- ---------------------------------------------------------------------------
create policy "workspace_members_select"
on public.workspace_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
  or (
    invitation_status = 'pending'
    and invite_token is not null
  )
);

create policy "workspace_members_insert"
on public.workspace_members for insert
to authenticated
with check (
  public.is_workspace_owner(workspace_id)
  or public.has_workspace_role(
    workspace_id,
    array['owner', 'partner', 'admin']::public.member_role[]
  )
  or (
    user_id = auth.uid()
    and role = 'owner'
    and invitation_status = 'accepted'
  )
  or public.is_platform_admin()
);

create policy "workspace_members_update"
on public.workspace_members for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_workspace_owner(workspace_id)
  or public.has_workspace_role(
    workspace_id,
    array['owner', 'partner', 'admin']::public.member_role[]
  )
  or public.is_platform_admin()
)
with check (
  user_id = auth.uid()
  or public.is_workspace_owner(workspace_id)
  or public.has_workspace_role(
    workspace_id,
    array['owner', 'partner', 'admin']::public.member_role[]
  )
  or public.is_platform_admin()
);

create policy "workspace_members_delete"
on public.workspace_members for delete
to authenticated
using (
  public.is_workspace_owner(workspace_id)
  or public.has_workspace_role(workspace_id, array['admin']::public.member_role[])
  or public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- weddings policies (no public access — guest PII never public)
-- ---------------------------------------------------------------------------
create policy "weddings_select_member"
on public.weddings for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
);

create policy "weddings_insert_member"
on public.weddings for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  or public.is_workspace_owner(workspace_id)
  or public.is_platform_admin()
);

create policy "weddings_update_member"
on public.weddings for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
)
with check (
  public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- subscriptions policies
-- ---------------------------------------------------------------------------
create policy "subscriptions_select_member"
on public.subscriptions for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
);

create policy "subscriptions_insert_owner"
on public.subscriptions for insert
to authenticated
with check (
  public.is_workspace_owner(workspace_id)
  or public.is_platform_admin()
);

create policy "subscriptions_update_owner_or_admin"
on public.subscriptions for update
to authenticated
using (
  public.is_workspace_owner(workspace_id)
  or public.is_platform_admin()
)
with check (
  public.is_workspace_owner(workspace_id)
  or public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- feature_entitlements policies
-- ---------------------------------------------------------------------------
create policy "feature_entitlements_select_member"
on public.feature_entitlements for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
);

create policy "feature_entitlements_insert_owner"
on public.feature_entitlements for insert
to authenticated
with check (
  public.is_workspace_owner(workspace_id)
  or public.is_platform_admin()
);

create policy "feature_entitlements_update_owner_or_admin"
on public.feature_entitlements for update
to authenticated
using (
  public.is_workspace_owner(workspace_id)
  or public.is_platform_admin()
)
with check (
  public.is_workspace_owner(workspace_id)
  or public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- audit_logs policies
-- ---------------------------------------------------------------------------
create policy "audit_logs_select_member_or_admin"
on public.audit_logs for select
to authenticated
using (
  (
    workspace_id is not null
    and public.is_workspace_member(workspace_id)
  )
  or public.is_platform_admin()
);

create policy "audit_logs_insert_authenticated"
on public.audit_logs for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    workspace_id is null
    or public.is_workspace_member(workspace_id)
    or public.is_platform_admin()
  )
);

-- ---------------------------------------------------------------------------
-- user_consents policies
-- ---------------------------------------------------------------------------
create policy "user_consents_select_own_or_admin"
on public.user_consents for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_platform_admin()
);

create policy "user_consents_insert_own"
on public.user_consents for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_consents_update_own"
on public.user_consents for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Notes for future public wedding websites:
-- Guest personal data must NEVER have anon SELECT policies.
-- Public pages should use controlled RPC/views that expose only
-- non-PII content (couple names, date, venue) after explicit publish.
-- Industry research data requires consent_type = anonymized_industry_research.
-- ---------------------------------------------------------------------------
