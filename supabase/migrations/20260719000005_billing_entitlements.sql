-- Billing extensions + Raian contracts + entitlement sync

create type public.billing_interval as enum (
  'month', 'year', 'one_time_12m', 'one_time_18m', 'lifetime', 'grant'
);

alter table public.subscriptions
  add column if not exists product_key text,
  add column if not exists billing_interval public.billing_interval default 'month',
  add column if not exists access_ends_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

create table public.stripe_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb
);

create table public.one_time_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  product_key text not null,
  amount_ron integer,
  currency text not null default 'ron',
  status text not null default 'succeeded',
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index one_time_payments_workspace_idx on public.one_time_payments (workspace_id);

create table public.client_contract_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  external_contract_reference text,
  package_name text,
  access_plan public.subscription_plan not null default 'premium',
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  activation_code text unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index client_contract_links_workspace_idx on public.client_contract_links (workspace_id);

alter table public.stripe_events enable row level security;
alter table public.one_time_payments enable row level security;
alter table public.client_contract_links enable row level security;

create policy stripe_events_admin on public.stripe_events
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy one_time_payments_select on public.one_time_payments
for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy one_time_payments_admin_write on public.one_time_payments
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy client_contract_links_admin on public.client_contract_links
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy client_contract_links_member_select on public.client_contract_links
for select to authenticated
using (public.is_workspace_member(workspace_id));

-- Sync entitlements from plan/product
create or replace function public.sync_workspace_entitlements(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
  plan_key text;
  expired boolean := false;
begin
  select * into sub from public.subscriptions where workspace_id = p_workspace_id;
  if sub is null then
    return;
  end if;

  plan_key := coalesce(sub.product_key, sub.plan::text);
  if sub.access_ends_at is not null and sub.access_ends_at < timezone('utc', now()) then
    expired := true;
  end if;
  if sub.status in ('canceled', 'incomplete') and sub.plan <> 'trial' then
    expired := true;
  end if;

  -- module toggles
  insert into public.feature_entitlements (workspace_id, feature_key, enabled, usage_limit, usage_value)
  values
    (p_workspace_id, 'planner', not expired, null, 0),
    (p_workspace_id, 'guests', not expired, null, 0),
    (p_workspace_id, 'budget', not expired, null, 0),
    (p_workspace_id, 'vendors', not expired, null, 0),
    (p_workspace_id, 'invitations', not expired, case when sub.plan in ('trial','starter') then 1 when sub.plan in ('essentials','premium') then 3 else 50 end, 0),
    (p_workspace_id, 'website', not expired and sub.plan not in ('trial'), null, 0),
    (p_workspace_id, 'website_publish', not expired and sub.plan not in ('trial','starter'), null, 0),
    (p_workspace_id, 'remove_branding', not expired and sub.plan in ('premium','agency'), null, 0),
    (p_workspace_id, 'pdf_export', not expired and sub.plan in ('essentials','premium','agency'), null, 0),
    (p_workspace_id, 'custom_domain', not expired and sub.plan = 'agency', null, 0),
    (p_workspace_id, 'premium_templates', not expired and sub.plan in ('essentials','premium','agency'), null, 0),
    (p_workspace_id, 'analytics', not expired and sub.plan in ('essentials','premium','agency'), null, 0),
    (p_workspace_id, 'white_label', not expired and (sub.plan = 'agency' or plan_key = 'white_label'), null, 0),
    (p_workspace_id, 'guest_limit', not expired, case when sub.plan in ('trial','starter') then 50 when sub.plan in ('essentials','premium') then 500 else 5000 end, 0),
    (p_workspace_id, 'invitation_projects', not expired, case when sub.plan in ('trial','starter') then 1 when sub.plan in ('essentials','premium') then 3 else 50 end, 0),
    (p_workspace_id, 'collaborator_limit', not expired, case when sub.plan in ('trial','starter') then 2 when sub.plan = 'essentials' then 5 else 20 end, 0),
    (p_workspace_id, 'storage_limit', not expired, case when sub.plan in ('trial','starter') then 500 when sub.plan in ('essentials','premium') then 5000 else 50000 end, 0),
    (p_workspace_id, 'wedding_limit', not expired, case when sub.plan = 'agency' then 50 else 1 end, 0)
  on conflict (workspace_id, feature_key) do update
  set
    enabled = excluded.enabled,
    usage_limit = coalesce(excluded.usage_limit, public.feature_entitlements.usage_limit),
    updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.sync_workspace_entitlements(uuid) from public;
grant execute on function public.sync_workspace_entitlements(uuid) to authenticated;
