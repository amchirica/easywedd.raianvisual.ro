-- Billing plans catalog, access_source, contracts lifecycle, pending checkouts

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.access_source as enum (
    'stripe_subscription',
    'stripe_one_time',
    'admin_grant',
    'trial',
    'partner',
    'legacy'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.contract_status as enum (
    'draft',
    'pending_signature',
    'active',
    'expired',
    'canceled',
    'completed'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Plans + entitlements (single source of truth)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_plans (
  key text primary key,
  name text not null,
  description text not null default '',
  maps_to_subscription_plan public.subscription_plan not null,
  billing_type text not null check (billing_type in ('subscription', 'one_time', 'grant', 'trial')),
  interval public.billing_interval not null default 'month',
  guest_limit integer not null default 50,
  website_publishing boolean not null default false,
  pdf_export boolean not null default false,
  invitations boolean not null default true,
  seating boolean not null default true,
  vendors boolean not null default true,
  analytics boolean not null default false,
  storage_mb integer not null default 500,
  workspace_limit integer not null default 1,
  access_months integer,
  stripe_price_env text,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_plans enable row level security;

drop policy if exists billing_plans_public_select on public.billing_plans;
create policy billing_plans_public_select
on public.billing_plans for select
to anon, authenticated
using (is_public = true or public.is_platform_admin());

drop policy if exists billing_plans_admin_write on public.billing_plans;
create policy billing_plans_admin_write
on public.billing_plans for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

insert into public.billing_plans (
  key, name, description, maps_to_subscription_plan, billing_type, interval,
  guest_limit, website_publishing, pdf_export, invitations, seating, vendors,
  analytics, storage_mb, workspace_limit, access_months, stripe_price_env,
  is_public, sort_order
) values
  ('trial', 'Trial', 'Perioadă de încercare.', 'trial', 'trial', 'month',
    50, false, false, true, true, true, false, 500, 1, 1, null, false, 0),
  ('starter', 'Starter', 'Planificare de bază, abonament lunar.', 'starter', 'subscription', 'month',
    100, false, false, true, true, true, false, 500, 1, null, 'STRIPE_PRICE_STARTER_MONTHLY', true, 10),
  ('essentials', 'Essentials / Partner', 'Planner + invitații + site (partener / contract).', 'essentials', 'grant', 'grant',
    500, true, true, true, true, true, true, 5000, 1, 12, null, true, 20),
  ('premium_pass_12', 'Premium Wedding Pass — 12 luni', 'Acces Premium 12 luni (plată unică).', 'premium', 'one_time', 'one_time_12m',
    5000, true, true, true, true, true, true, 20000, 1, 12, 'STRIPE_PRICE_PREMIUM_PASS_12', true, 30),
  ('premium_pass_18', 'Premium Wedding Pass — 18 luni', 'Acces Premium 18 luni (plată unică).', 'premium', 'one_time', 'one_time_18m',
    5000, true, true, true, true, true, true, 20000, 1, 18, 'STRIPE_PRICE_PREMIUM_PASS_18', true, 40),
  ('pro', 'Pro', 'Pentru profesioniști — abonament.', 'agency', 'subscription', 'month',
    5000, true, true, true, true, true, true, 50000, 50, null, 'STRIPE_PRICE_PRO_MONTHLY', true, 50)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  maps_to_subscription_plan = excluded.maps_to_subscription_plan,
  billing_type = excluded.billing_type,
  interval = excluded.interval,
  guest_limit = excluded.guest_limit,
  website_publishing = excluded.website_publishing,
  pdf_export = excluded.pdf_export,
  invitations = excluded.invitations,
  seating = excluded.seating,
  vendors = excluded.vendors,
  analytics = excluded.analytics,
  storage_mb = excluded.storage_mb,
  workspace_limit = excluded.workspace_limit,
  access_months = excluded.access_months,
  stripe_price_env = excluded.stripe_price_env,
  is_public = excluded.is_public,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Subscriptions enrichment
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists access_source public.access_source not null default 'legacy',
  add column if not exists plan_key text references public.billing_plans (key),
  add column if not exists stripe_checkout_session_id text,
  add column if not exists last_payment_at timestamptz,
  add column if not exists last_payment_stripe_id text,
  add column if not exists admin_notes text,
  add column if not exists soft_deleted_at timestamptz,
  add column if not exists granted_by uuid references public.profiles (id) on delete set null;

create index if not exists subscriptions_plan_key_idx on public.subscriptions (plan_key);
create index if not exists subscriptions_access_source_idx on public.subscriptions (access_source);
create index if not exists subscriptions_soft_deleted_idx on public.subscriptions (soft_deleted_at);

update public.subscriptions s
set plan_key = coalesce(s.product_key, s.plan::text)
where s.plan_key is null
  and exists (select 1 from public.billing_plans bp where bp.key = coalesce(s.product_key, s.plan::text));

update public.subscriptions
set access_source = case
  when billing_interval in ('one_time_12m', 'one_time_18m', 'lifetime') then 'stripe_one_time'::public.access_source
  when billing_interval = 'grant' then 'partner'::public.access_source
  when plan = 'trial' then 'trial'::public.access_source
  when stripe_subscription_id is not null then 'stripe_subscription'::public.access_source
  else 'legacy'::public.access_source
end
where access_source = 'legacy';

-- ---------------------------------------------------------------------------
-- Pending checkouts (external customers before account)
-- ---------------------------------------------------------------------------
create table if not exists public.pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan_key text not null references public.billing_plans (key),
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'fulfilled', 'expired', 'refunded')),
  claim_token text unique,
  workspace_id uuid references public.workspaces (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pending_checkouts_email_idx on public.pending_checkouts (lower(email));
create index if not exists pending_checkouts_status_idx on public.pending_checkouts (status);

alter table public.pending_checkouts enable row level security;

drop policy if exists pending_checkouts_admin on public.pending_checkouts;
create policy pending_checkouts_admin
on public.pending_checkouts for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Contracts (full lifecycle) — extends Raian contract links
-- ---------------------------------------------------------------------------
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  plan_key text references public.billing_plans (key),
  client_contract_link_id uuid references public.client_contract_links (id) on delete set null,
  status public.contract_status not null default 'draft',
  title text not null default 'Contract EasyWedd',
  document_url text,
  signature_status text not null default 'unsigned'
    check (signature_status in ('unsigned', 'sent', 'signed', 'declined')),
  starts_at timestamptz,
  ends_at timestamptz,
  internal_notes text,
  soft_deleted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_workspace_idx on public.contracts (workspace_id);
create index if not exists contracts_status_idx on public.contracts (status);
create index if not exists contracts_user_idx on public.contracts (user_id);

alter table public.contracts enable row level security;

drop policy if exists contracts_admin on public.contracts;
create policy contracts_admin
on public.contracts for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists contracts_member_select on public.contracts;
create policy contracts_member_select
on public.contracts for select
to authenticated
using (
  soft_deleted_at is null
  and (public.is_workspace_member(workspace_id) or public.is_platform_admin())
);

-- Enrich client_contract_links
alter table public.client_contract_links
  add column if not exists status public.contract_status not null default 'active',
  add column if not exists document_url text,
  add column if not exists signature_status text not null default 'unsigned',
  add column if not exists internal_notes text,
  add column if not exists soft_deleted_at timestamptz,
  add column if not exists user_id uuid references public.profiles (id) on delete set null;

-- Profiles soft suspend
alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists soft_deleted_at timestamptz;

alter table public.workspaces
  add column if not exists soft_deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- Sync entitlements from billing_plans when available
-- ---------------------------------------------------------------------------
create or replace function public.sync_workspace_entitlements(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.billing_plans%rowtype;
  v_expired boolean := false;
  v_plan_key text;
begin
  select * into v_sub
  from public.subscriptions
  where workspace_id = p_workspace_id
    and soft_deleted_at is null
  order by created_at desc
  limit 1;

  if not found then
    return;
  end if;

  v_plan_key := coalesce(v_sub.plan_key, v_sub.product_key, v_sub.plan::text);

  select * into v_plan from public.billing_plans where key = v_plan_key;

  v_expired := (
    (v_sub.access_ends_at is not null and v_sub.access_ends_at < now())
    or v_sub.status in ('canceled', 'incomplete')
  ) and v_sub.status is distinct from 'trialing';

  if v_plan.key is not null then
    insert into public.feature_entitlements (workspace_id, feature_key, enabled, usage_limit, usage_value)
    values
      (p_workspace_id, 'planner', not v_expired, null, 0),
      (p_workspace_id, 'guests', not v_expired, v_plan.guest_limit, 0),
      (p_workspace_id, 'guest_limit', not v_expired, v_plan.guest_limit, 0),
      (p_workspace_id, 'budget', not v_expired, null, 0),
      (p_workspace_id, 'vendors', not v_expired and v_plan.vendors, null, 0),
      (p_workspace_id, 'seating', not v_expired and v_plan.seating, null, 0),
      (p_workspace_id, 'invitations', not v_expired and v_plan.invitations, null, 0),
      (p_workspace_id, 'website', not v_expired, null, 0),
      (p_workspace_id, 'website_publish', not v_expired and v_plan.website_publishing, null, 0),
      (p_workspace_id, 'pdf_export', not v_expired and v_plan.pdf_export, null, 0),
      (p_workspace_id, 'analytics', not v_expired and v_plan.analytics, null, 0),
      (p_workspace_id, 'storage_limit', not v_expired, v_plan.storage_mb, 0),
      (p_workspace_id, 'wedding_limit', not v_expired, v_plan.workspace_limit, 0)
    on conflict (workspace_id, feature_key) do update set
      enabled = excluded.enabled,
      usage_limit = excluded.usage_limit,
      updated_at = now();
    return;
  end if;

  -- Fallback legacy mapping if plan row missing
  insert into public.feature_entitlements (workspace_id, feature_key, enabled, usage_limit, usage_value)
  values
    (p_workspace_id, 'planner', not v_expired, null, 0),
    (p_workspace_id, 'guests', not v_expired, 50, 0),
    (p_workspace_id, 'budget', not v_expired, null, 0),
    (p_workspace_id, 'vendors', not v_expired, null, 0)
  on conflict (workspace_id, feature_key) do update set
    enabled = excluded.enabled,
    updated_at = now();
end;
$$;
