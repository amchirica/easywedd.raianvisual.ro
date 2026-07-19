-- Fix: workspaces.owner_id → public.profiles(id)
-- Profile must exist before workspace insert. Recreate auth trigger, backfill,
-- allow own profile insert, and provide transactional onboarding RPC.

-- ---------------------------------------------------------------------------
-- A. handle_new_user (idempotent) + trigger on auth.users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ),
    coalesce(new.created_at, timezone('utc', now())),
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- B. Backfill profiles for existing auth users
-- ---------------------------------------------------------------------------
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
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- D. RLS: authenticated users may insert/select/update own profile only
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- ensure_own_profile — safe for server actions / RPC
-- ---------------------------------------------------------------------------
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  meta jsonb;
  result public.profiles;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select raw_user_meta_data into meta
  from auth.users
  where id = uid;

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
  where u.id = uid
  on conflict (id) do update
  set
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    updated_at = timezone('utc', now());

  select * into result from public.profiles where id = uid;
  return result;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- C. Atomic onboarding workspace creation
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
  uid uuid := auth.uid();
  existing_workspace_id uuid;
  existing_wedding_id uuid;
  workspace_id uuid;
  wedding_id uuid;
  trial_ends timestamptz;
  now_ts timestamptz := timezone('utc', now());
  feature_keys text[] := array[
    'planner', 'invitations', 'website', 'guests', 'budget', 'vendors',
    'guest_limit', 'invitation_projects', 'remove_branding', 'pdf_export',
    'website_publish', 'custom_domain', 'premium_templates', 'analytics',
    'collaborator_limit', 'storage_limit', 'wedding_limit', 'white_label'
  ];
  fk text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Ensure profile exists (FK target for workspaces.owner_id)
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
    coalesce(u.created_at, now_ts),
    now_ts
  from auth.users u
  where u.id = uid
  on conflict (id) do update
  set
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    updated_at = now_ts;

  if not exists (select 1 from public.profiles where id = uid) then
    raise exception 'profile_missing';
  end if;

  -- Idempotent retry: reuse existing owned workspace + wedding
  select w.id, wed.id
  into existing_workspace_id, existing_wedding_id
  from public.workspaces w
  left join public.weddings wed on wed.workspace_id = w.id
  where w.owner_id = uid
  order by w.created_at asc
  limit 1;

  if existing_workspace_id is not null and existing_wedding_id is not null then
    update public.profiles
    set onboarding_completed = true,
        full_name = coalesce(nullif(trim(p_couple_name_1), ''), full_name),
        updated_at = now_ts
    where id = uid;

    return jsonb_build_object(
      'workspace_id', existing_workspace_id,
      'wedding_id', existing_wedding_id,
      'reused', true
    );
  end if;

  if existing_workspace_id is not null and existing_wedding_id is null then
    insert into public.weddings (
      workspace_id, couple_name_1, couple_name_2, wedding_date,
      city, venue_name, estimated_guest_count, currency, wedding_status
    ) values (
      existing_workspace_id, p_couple_name_1, p_couple_name_2, p_wedding_date,
      p_city, p_venue_name, p_estimated_guest_count, 'RON', 'planning'
    )
    returning id into wedding_id;

    update public.profiles
    set onboarding_completed = true,
        full_name = coalesce(nullif(trim(p_couple_name_1), ''), full_name),
        updated_at = now_ts
    where id = uid;

    return jsonb_build_object(
      'workspace_id', existing_workspace_id,
      'wedding_id', wedding_id,
      'reused', true
    );
  end if;

  insert into public.workspaces (
    name, slug, workspace_type, owner_id, status
  ) values (
    p_workspace_name,
    p_slug,
    p_workspace_type,
    uid,
    'active'
  )
  returning id into workspace_id;

  insert into public.workspace_members (
    workspace_id, user_id, role, invited_by, invitation_status
  ) values (
    workspace_id, uid, 'owner', uid, 'accepted'
  );

  insert into public.weddings (
    workspace_id, couple_name_1, couple_name_2, wedding_date,
    city, venue_name, estimated_guest_count, currency, wedding_status
  ) values (
    workspace_id, p_couple_name_1, p_couple_name_2, p_wedding_date,
    p_city, p_venue_name, p_estimated_guest_count, 'RON', 'planning'
  )
  returning id into wedding_id;

  trial_ends := now_ts + make_interval(days => greatest(coalesce(p_trial_days, 14), 1));

  insert into public.subscriptions (
    workspace_id, plan, status, trial_ends_at
  ) values (
    workspace_id, 'trial', 'trialing', trial_ends
  );

  foreach fk in array feature_keys
  loop
    insert into public.feature_entitlements (
      workspace_id, feature_key, enabled, usage_limit, usage_value
    ) values (
      workspace_id,
      fk,
      fk in (
        'planner', 'guests', 'budget', 'vendors', 'invitations', 'website',
        'guest_limit', 'invitation_projects', 'collaborator_limit',
        'storage_limit', 'wedding_limit'
      ),
      case
        when fk in ('invitations', 'invitation_projects', 'wedding_limit') then 1
        when fk = 'guest_limit' then 50
        when fk = 'collaborator_limit' then 2
        when fk = 'storage_limit' then 500
        else 0
      end,
      0
    )
    on conflict (workspace_id, feature_key) do nothing;
  end loop;

  perform public.sync_workspace_entitlements(workspace_id);

  insert into public.user_consents (
    user_id, workspace_id, consent_type, consent_version,
    granted, granted_at, revoked_at, source
  ) values (
    uid,
    workspace_id,
    'anonymized_industry_research',
    p_consent_version,
    coalesce(p_anonymized_industry_research, false),
    case when coalesce(p_anonymized_industry_research, false) then now_ts else null end,
    case when coalesce(p_anonymized_industry_research, false) then null else now_ts end,
    'onboarding'
  );

  insert into public.audit_logs (
    workspace_id, user_id, action, entity_type, entity_id, metadata
  ) values (
    workspace_id, uid, 'workspace.created', 'workspace', workspace_id,
    jsonb_build_object('workspace_type', p_workspace_type)
  );

  update public.profiles
  set
    onboarding_completed = true,
    full_name = coalesce(nullif(trim(p_couple_name_1), ''), full_name),
    updated_at = now_ts
  where id = uid;

  return jsonb_build_object(
    'workspace_id', workspace_id,
    'wedding_id', wedding_id,
    'reused', false
  );
exception
  when unique_violation then
    -- Concurrent retry on slug: surface cleanly
    raise exception 'workspace_slug_taken';
end;
$$;

revoke all on function public.create_onboarding_workspace(
  text, text, public.workspace_type, text, text, date, text, text, integer, boolean, text, integer
) from public;

grant execute on function public.create_onboarding_workspace(
  text, text, public.workspace_type, text, text, date, text, text, integer, boolean, text, integer
) to authenticated;
