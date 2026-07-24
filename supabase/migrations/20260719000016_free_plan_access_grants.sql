-- EasyWedd: free plan, account approval, access grants, fixed entitlement sync
-- ---------------------------------------------------------------------------

-- Account status on profiles
do $$ begin
  create type public.account_status as enum (
    'pending',
    'limited',
    'approved',
    'suspended'
  );
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'limited',
  add column if not exists account_status_note text,
  add column if not exists account_status_updated_at timestamptz,
  add column if not exists account_status_updated_by uuid references public.profiles (id) on delete set null;

-- Existing suspended users
update public.profiles
set account_status = 'suspended'
where suspended_at is not null
  and account_status is distinct from 'suspended';

-- Prefer plan_key='free' with access_source='trial' (enum 'free' avoided in same migration)

-- Expand billing_plans feature flags
alter table public.billing_plans
  add column if not exists remove_branding boolean not null default false,
  add column if not exists premium_templates boolean not null default false,
  add column if not exists custom_domain boolean not null default false,
  add column if not exists white_label boolean not null default false,
  add column if not exists invitation_projects integer not null default 1,
  add column if not exists collaborator_limit integer not null default 2;

-- Free plan + tighten trial to free-like basics
insert into public.billing_plans (
  key, name, description, maps_to_subscription_plan, billing_type, interval,
  guest_limit, website_publishing, pdf_export, invitations, seating, vendors,
  analytics, storage_mb, workspace_limit, access_months, stripe_price_env,
  is_public, sort_order,
  remove_branding, premium_templates, custom_domain, white_label,
  invitation_projects, collaborator_limit
) values
  (
    'free',
    'Gratuit',
    'Funcții de bază: planner, invitați, buget, 1 invitație, website draft.',
    'trial',
    'grant',
    'grant',
    30, false, false, true, false, false,
    false, 200, 1, null, null,
    true, 5,
    false, false, false, false,
    1, 1
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  guest_limit = excluded.guest_limit,
  website_publishing = excluded.website_publishing,
  pdf_export = excluded.pdf_export,
  invitations = excluded.invitations,
  seating = excluded.seating,
  vendors = excluded.vendors,
  analytics = excluded.analytics,
  storage_mb = excluded.storage_mb,
  workspace_limit = excluded.workspace_limit,
  remove_branding = excluded.remove_branding,
  premium_templates = excluded.premium_templates,
  custom_domain = excluded.custom_domain,
  white_label = excluded.white_label,
  invitation_projects = excluded.invitation_projects,
  collaborator_limit = excluded.collaborator_limit,
  is_public = excluded.is_public,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Trial = same basics as free, short duration (access_ends_at set in app)
update public.billing_plans set
  guest_limit = 30,
  website_publishing = false,
  pdf_export = false,
  invitations = true,
  seating = false,
  vendors = false,
  analytics = false,
  storage_mb = 200,
  workspace_limit = 1,
  remove_branding = false,
  premium_templates = false,
  custom_domain = false,
  white_label = false,
  invitation_projects = 1,
  collaborator_limit = 1,
  access_months = 1,
  description = 'Încercare scurtă cu aceleași limite ca planul Gratuit.',
  updated_at = now()
where key = 'trial';

-- Starter: seating/vendors on, publish off
update public.billing_plans set
  remove_branding = false,
  premium_templates = false,
  custom_domain = false,
  white_label = false,
  invitation_projects = 2,
  collaborator_limit = 3,
  seating = true,
  vendors = true,
  updated_at = now()
where key = 'starter';

-- Paid / grant plans: unlock premium flags
update public.billing_plans set
  remove_branding = true,
  premium_templates = true,
  custom_domain = (key in ('premium_pass_12', 'premium_pass_18', 'pro')),
  white_label = (key = 'pro'),
  invitation_projects = case when key = 'pro' then 50 else 10 end,
  collaborator_limit = case when key = 'pro' then 20 else 5 end,
  updated_at = now()
where key in ('essentials', 'premium_pass_12', 'premium_pass_18', 'pro');

-- Manual feature grants (admin)
create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default true,
  usage_limit integer,
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  reason text not null default '',
  granted_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete set null,
  revoke_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists access_grants_workspace_idx
  on public.access_grants (workspace_id)
  where revoked_at is null;

create trigger access_grants_set_updated_at
before update on public.access_grants
for each row execute function public.set_updated_at();

alter table public.access_grants enable row level security;

drop policy if exists access_grants_admin_all on public.access_grants;
create policy access_grants_admin_all
on public.access_grants for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists access_grants_member_select on public.access_grants;
create policy access_grants_member_select
on public.access_grants for select
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Fixed sync: free fallback, full feature matrix, grants overlay
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
  v_plan_key text := 'free';
  v_grant record;
begin
  select * into v_sub
  from public.subscriptions
  where workspace_id = p_workspace_id
    and soft_deleted_at is null
  order by created_at desc
  limit 1;

  if found then
    v_plan_key := coalesce(v_sub.plan_key, v_sub.product_key, v_sub.plan::text, 'free');

    -- Trial expiry uses trial_ends_at or access_ends_at
    v_expired := (
      v_sub.status in ('canceled', 'incomplete')
      or (v_sub.access_ends_at is not null and v_sub.access_ends_at < now())
      or (
        v_sub.status = 'trialing'
        and v_sub.trial_ends_at is not null
        and v_sub.trial_ends_at < now()
      )
    );

    if v_expired then
      v_plan_key := 'free';
      -- Downgrade subscription row markers without soft-delete (preserve history)
      update public.subscriptions
      set
        plan_key = 'free',
        plan = 'trial',
        status = case when status = 'trialing' then 'canceled' else status end,
        access_source = case
          when access_source in ('stripe_subscription', 'stripe_one_time', 'admin_grant', 'partner')
            then access_source
          else 'trial'
        end,
        updated_at = now()
      where id = v_sub.id
        and soft_deleted_at is null;
    end if;
  else
    v_plan_key := 'free';
    v_expired := false;
  end if;

  select * into v_plan from public.billing_plans where key = v_plan_key;
  if not found then
    select * into v_plan from public.billing_plans where key = 'free';
  end if;

  insert into public.feature_entitlements (workspace_id, feature_key, enabled, usage_limit, usage_value)
  values
    (p_workspace_id, 'planner', true, null, 0),
    (p_workspace_id, 'guests', true, coalesce(v_plan.guest_limit, 30), 0),
    (p_workspace_id, 'guest_limit', true, coalesce(v_plan.guest_limit, 30), 0),
    (p_workspace_id, 'budget', true, null, 0),
    (p_workspace_id, 'vendors', coalesce(v_plan.vendors, false), null, 0),
    (p_workspace_id, 'seating', coalesce(v_plan.seating, false), null, 0),
    (p_workspace_id, 'invitations', coalesce(v_plan.invitations, true), null, 0),
    (p_workspace_id, 'invitation_projects', coalesce(v_plan.invitations, true), coalesce(v_plan.invitation_projects, 1), 0),
    (p_workspace_id, 'website', true, null, 0),
    (p_workspace_id, 'website_publish', coalesce(v_plan.website_publishing, false), null, 0),
    (p_workspace_id, 'pdf_export', coalesce(v_plan.pdf_export, false), null, 0),
    (p_workspace_id, 'analytics', coalesce(v_plan.analytics, false), null, 0),
    (p_workspace_id, 'remove_branding', coalesce(v_plan.remove_branding, false), null, 0),
    (p_workspace_id, 'premium_templates', coalesce(v_plan.premium_templates, false), null, 0),
    (p_workspace_id, 'custom_domain', coalesce(v_plan.custom_domain, false), null, 0),
    (p_workspace_id, 'white_label', coalesce(v_plan.white_label, false), null, 0),
    (p_workspace_id, 'storage_limit', true, coalesce(v_plan.storage_mb, 200), 0),
    (p_workspace_id, 'wedding_limit', true, coalesce(v_plan.workspace_limit, 1), 0),
    (p_workspace_id, 'collaborator_limit', true, coalesce(v_plan.collaborator_limit, 1), 0)
  on conflict (workspace_id, feature_key) do update set
    enabled = excluded.enabled,
    usage_limit = excluded.usage_limit,
    updated_at = now();

  -- Overlay active admin feature grants
  for v_grant in
    select *
    from public.access_grants g
    where g.workspace_id = p_workspace_id
      and g.revoked_at is null
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
  loop
    insert into public.feature_entitlements (workspace_id, feature_key, enabled, usage_limit, usage_value)
    values (
      p_workspace_id,
      v_grant.feature_key,
      v_grant.enabled,
      v_grant.usage_limit,
      0
    )
    on conflict (workspace_id, feature_key) do update set
      enabled = excluded.enabled,
      usage_limit = coalesce(excluded.usage_limit, public.feature_entitlements.usage_limit),
      updated_at = now();
  end loop;
end;
$$;

-- Onboarding: free plan (same signature as 00011)
create or replace function public.create_onboarding_workspace(
  p_workspace_name text,
  p_slug text,
  p_workspace_type public.workspace_type,
  p_couple_name_1 text,
  p_couple_name_2 text,
  p_wedding_date date default null,
  p_city text default null,
  p_venue_name text default null,
  p_estimated_guest_count integer default null,
  p_anonymized_industry_research boolean default false,
  p_consent_version text default '2026-07-01',
  p_trial_days integer default 14,
  p_partner_email text default null,
  p_site_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing_workspace_id uuid;
  v_existing_wedding_id uuid;
  v_workspace_id uuid;
  v_wedding_id uuid;
  v_now timestamptz := timezone('utc', now());
  v_partner text := nullif(lower(trim(coalesce(p_partner_email, ''))), '');
  v_invite jsonb;
  v_inviter text;
  v_reused boolean := false;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, email, full_name, created_at, updated_at, account_status)
  select
    u.id,
    coalesce(u.email, ''),
    nullif(
      trim(
        coalesce(
          u.raw_user_meta_data ->> 'full_name',
          u.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ),
    coalesce(u.created_at, v_now),
    v_now,
    'limited'::public.account_status
  from auth.users u
  where u.id = v_uid
  on conflict (id) do update
  set
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    updated_at = v_now;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'profile_missing';
  end if;

  select coalesce(p.full_name, p.email, '') into v_inviter
  from public.profiles p where p.id = v_uid;

  select w.id, wed.id
  into v_existing_workspace_id, v_existing_wedding_id
  from public.workspaces w
  left join public.weddings wed on wed.workspace_id = w.id
  where w.owner_id = v_uid
  order by w.created_at asc
  limit 1;

  if v_existing_workspace_id is not null and v_existing_wedding_id is not null then
    update public.profiles
    set onboarding_completed = true,
        full_name = coalesce(nullif(trim(p_couple_name_1), ''), full_name),
        account_status = coalesce(account_status, 'limited'),
        updated_at = v_now
    where id = v_uid;

    v_workspace_id := v_existing_workspace_id;
    v_wedding_id := v_existing_wedding_id;
    v_reused := true;
  elsif v_existing_workspace_id is not null and v_existing_wedding_id is null then
    insert into public.weddings (
      workspace_id, couple_name_1, couple_name_2, wedding_date,
      city, venue_name, estimated_guest_count, currency, wedding_status
    ) values (
      v_existing_workspace_id, p_couple_name_1, p_couple_name_2, p_wedding_date,
      p_city, p_venue_name, p_estimated_guest_count, 'RON', 'planning'
    )
    returning id into v_wedding_id;

    update public.profiles
    set onboarding_completed = true,
        full_name = coalesce(nullif(trim(p_couple_name_1), ''), full_name),
        account_status = coalesce(account_status, 'limited'),
        updated_at = v_now
    where id = v_uid;

    v_workspace_id := v_existing_workspace_id;
    v_reused := true;
  else
    insert into public.workspaces (
      name, slug, workspace_type, owner_id, status
    ) values (
      p_workspace_name, p_slug, p_workspace_type, v_uid, 'active'
    )
    returning id into v_workspace_id;

    insert into public.workspace_members (
      workspace_id, user_id, role, invited_by, invitation_status
    ) values (
      v_workspace_id, v_uid, 'owner', v_uid, 'accepted'
    );

    insert into public.weddings (
      workspace_id, couple_name_1, couple_name_2, wedding_date,
      city, venue_name, estimated_guest_count, currency, wedding_status
    ) values (
      v_workspace_id, p_couple_name_1, p_couple_name_2, p_wedding_date,
      p_city, p_venue_name, p_estimated_guest_count, 'RON', 'planning'
    )
    returning id into v_wedding_id;

    -- Free plan (not full-feature trial)
    insert into public.subscriptions (
      workspace_id, plan, status, plan_key, product_key, access_source,
      trial_ends_at, access_ends_at
    ) values (
      v_workspace_id, 'trial', 'active', 'free', 'free', 'trial',
      null, null
    );

    perform public.sync_workspace_entitlements(v_workspace_id);

    insert into public.user_consents (
      user_id, workspace_id, consent_type, consent_version,
      granted, granted_at, revoked_at, source
    ) values (
      v_uid,
      v_workspace_id,
      'anonymized_industry_research',
      p_consent_version,
      coalesce(p_anonymized_industry_research, false),
      case when coalesce(p_anonymized_industry_research, false) then v_now else null end,
      case when coalesce(p_anonymized_industry_research, false) then null else v_now end,
      'onboarding'
    );

    insert into public.audit_logs (
      workspace_id, user_id, action, entity_type, entity_id, metadata
    ) values (
      v_workspace_id, v_uid, 'workspace.created', 'workspace', v_workspace_id,
      jsonb_build_object('workspace_type', p_workspace_type, 'plan_key', 'free')
    );

    update public.profiles
    set
      onboarding_completed = true,
      full_name = coalesce(nullif(trim(p_couple_name_1), ''), full_name),
      account_status = 'limited',
      account_status_updated_at = v_now,
      updated_at = v_now
    where id = v_uid;
  end if;

  if v_partner is not null then
    begin
      v_invite := public.create_partner_invitation(
        v_workspace_id,
        v_partner,
        'partner',
        14,
        p_site_url,
        coalesce(nullif(trim(p_couple_name_1), ''), v_inviter),
        coalesce(nullif(trim(p_workspace_name), ''), p_couple_name_1 || ' & ' || p_couple_name_2)
      );
    exception
      when others then
        v_invite := jsonb_build_object('error', SQLERRM);
    end;
  end if;

  return jsonb_build_object(
    'workspace_id', v_workspace_id,
    'wedding_id', v_wedding_id,
    'reused', v_reused,
    'partner_invite', coalesce(v_invite, 'null'::jsonb)
  );
exception
  when unique_violation then
    raise exception 'workspace_slug_taken';
end;
$$;
