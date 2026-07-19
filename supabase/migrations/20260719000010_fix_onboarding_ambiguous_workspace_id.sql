-- Fix create_onboarding_workspace: PL/pgSQL var "workspace_id" collided with
-- column name workspace_id → "column reference workspace_id is ambiguous".
-- Also ensure explicit own-profile RLS policies (select/insert/update).

-- ---------------------------------------------------------------------------
-- Profiles RLS: own row only (idempotent recreate of named policies)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Keep existing shared/admin select if present (profiles_select_own_or_shared).
-- Do not drop it — it allows shared workspace member visibility.

-- ---------------------------------------------------------------------------
-- Recreate onboarding RPC with non-ambiguous variable names
-- ---------------------------------------------------------------------------
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
  p_trial_days integer default 14
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
  v_trial_ends timestamptz;
  v_now timestamptz := timezone('utc', now());
  v_feature_keys text[] := array[
    'planner', 'invitations', 'website', 'guests', 'budget', 'vendors',
    'guest_limit', 'invitation_projects', 'remove_branding', 'pdf_export',
    'website_publish', 'custom_domain', 'premium_templates', 'analytics',
    'collaborator_limit', 'storage_limit', 'wedding_limit', 'white_label'
  ];
  v_fk text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- PROFILE_CREATE (security definer — bypasses RLS)
  insert into public.profiles (id, email, full_name, created_at, updated_at)
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
    v_now
  from auth.users u
  where u.id = v_uid
  on conflict (id) do update
  set
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    updated_at = v_now;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'profile_missing';
  end if;

  -- Idempotent retry
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
        updated_at = v_now
    where id = v_uid;

    return jsonb_build_object(
      'workspace_id', v_existing_workspace_id,
      'wedding_id', v_existing_wedding_id,
      'reused', true
    );
  end if;

  if v_existing_workspace_id is not null and v_existing_wedding_id is null then
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
        updated_at = v_now
    where id = v_uid;

    return jsonb_build_object(
      'workspace_id', v_existing_workspace_id,
      'wedding_id', v_wedding_id,
      'reused', true
    );
  end if;

  -- WORKSPACE_CREATE
  insert into public.workspaces (
    name, slug, workspace_type, owner_id, status
  ) values (
    p_workspace_name,
    p_slug,
    p_workspace_type,
    v_uid,
    'active'
  )
  returning id into v_workspace_id;

  -- MEMBERSHIP_CREATE
  insert into public.workspace_members (
    workspace_id, user_id, role, invited_by, invitation_status
  ) values (
    v_workspace_id, v_uid, 'owner', v_uid, 'accepted'
  );

  -- WEDDING_CREATE
  insert into public.weddings (
    workspace_id, couple_name_1, couple_name_2, wedding_date,
    city, venue_name, estimated_guest_count, currency, wedding_status
  ) values (
    v_workspace_id, p_couple_name_1, p_couple_name_2, p_wedding_date,
    p_city, p_venue_name, p_estimated_guest_count, 'RON', 'planning'
  )
  returning id into v_wedding_id;

  v_trial_ends := v_now + make_interval(days => greatest(coalesce(p_trial_days, 14), 1));

  insert into public.subscriptions (
    workspace_id, plan, status, trial_ends_at
  ) values (
    v_workspace_id, 'trial', 'trialing', v_trial_ends
  );

  foreach v_fk in array v_feature_keys
  loop
    insert into public.feature_entitlements (
      workspace_id, feature_key, enabled, usage_limit, usage_value
    ) values (
      v_workspace_id,
      v_fk,
      v_fk in (
        'planner', 'guests', 'budget', 'vendors', 'invitations', 'website',
        'guest_limit', 'invitation_projects', 'collaborator_limit',
        'storage_limit', 'wedding_limit'
      ),
      case
        when v_fk in ('invitations', 'invitation_projects', 'wedding_limit') then 1
        when v_fk = 'guest_limit' then 50
        when v_fk = 'collaborator_limit' then 2
        when v_fk = 'storage_limit' then 500
        else 0
      end,
      0
    )
    on conflict (workspace_id, feature_key) do nothing;
  end loop;

  begin
    perform public.sync_workspace_entitlements(v_workspace_id);
  exception
    when undefined_function then
      null;
    when others then
      null;
  end;

  -- CONSENT_CREATE
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
    jsonb_build_object('workspace_type', p_workspace_type)
  );

  update public.profiles
  set
    onboarding_completed = true,
    full_name = coalesce(nullif(trim(p_couple_name_1), ''), full_name),
    updated_at = v_now
  where id = v_uid;

  return jsonb_build_object(
    'workspace_id', v_workspace_id,
    'wedding_id', v_wedding_id,
    'reused', false
  );
exception
  when unique_violation then
    raise exception 'workspace_slug_taken';
end;
$$;

revoke all on function public.create_onboarding_workspace(
  text, text, public.workspace_type, text, text, date, text, text, integer, boolean, text, integer
) from public;

grant execute on function public.create_onboarding_workspace(
  text, text, public.workspace_type, text, text, date, text, text, integer, boolean, text, integer
) to authenticated;

-- Harden ensure_own_profile (same pattern, clear errors)
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result public.profiles;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, email, full_name, created_at, updated_at)
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
    coalesce(u.created_at, timezone('utc', now())),
    timezone('utc', now())
  from auth.users u
  where u.id = v_uid
  on conflict (id) do update
  set
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    updated_at = timezone('utc', now());

  select * into v_result from public.profiles where id = v_uid;
  if v_result.id is null then
    raise exception 'profile_missing';
  end if;
  return v_result;
end;
$$;
