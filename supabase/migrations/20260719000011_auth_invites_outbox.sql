-- Auth invite hardening + email outbox (incremental; does not edit prior migrations)
-- - workspace_invitations (token hash, expiry, status)
-- - email_outbox for durable partner invite delivery
-- - accept_workspace_invitation / create_partner_invitation RPCs
-- - extend create_onboarding_workspace with optional partner invite

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'workspace_invite_status' and n.nspname = 'public'
  ) then
    create type public.workspace_invite_status as enum (
      'pending',
      'accepted',
      'expired',
      'revoked'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'email_outbox_status' and n.nspname = 'public'
  ) then
    create type public.email_outbox_status as enum (
      'pending',
      'processing',
      'sent',
      'failed',
      'cancelled'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- workspace_invitations
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role public.member_role not null default 'partner',
  token_hash text not null unique,
  status public.workspace_invite_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_invitations_email_lowercase check (email = lower(email))
);

create index if not exists workspace_invitations_workspace_id_idx
  on public.workspace_invitations (workspace_id);

create unique index if not exists workspace_invitations_pending_email_uidx
  on public.workspace_invitations (workspace_id, email)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- email_outbox
-- ---------------------------------------------------------------------------
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  event_type text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.email_outbox_status not null default 'pending',
  attempt_count integer not null default 0,
  last_error text,
  scheduled_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_outbox_pending_idx
  on public.email_outbox (status, scheduled_at)
  where status in ('pending', 'failed');

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.workspace_invitations enable row level security;
alter table public.email_outbox enable row level security;

drop policy if exists "workspace_invitations_select_members" on public.workspace_invitations;
create policy "workspace_invitations_select_members"
on public.workspace_invitations for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
);

drop policy if exists "workspace_invitations_insert_managers" on public.workspace_invitations;
create policy "workspace_invitations_insert_managers"
on public.workspace_invitations for insert
to authenticated
with check (
  public.is_workspace_owner(workspace_id)
  or public.has_workspace_role(workspace_id, array['owner', 'partner', 'admin']::public.member_role[])
  or public.is_platform_admin()
);

-- email_outbox: no direct client access (processed via security definer / service role)
drop policy if exists "email_outbox_select_none" on public.email_outbox;
-- intentionally no authenticated policies — access only via RPC / service role

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.hash_invite_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;

-- Preview for invite page (minimal fields; no workspace secrets)
create or replace function public.get_workspace_invitation_preview(p_token text)
returns table (
  id uuid,
  workspace_id uuid,
  role public.member_role,
  email text,
  status public.workspace_invite_status,
  expires_at timestamptz,
  is_expired boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hash text := public.hash_invite_token(p_token);
begin
  return query
  select
    i.id,
    i.workspace_id,
    i.role,
    i.email,
    i.status,
    i.expires_at,
    (i.expires_at < timezone('utc', now())) as is_expired
  from public.workspace_invitations i
  where i.token_hash = v_hash
  limit 1;
end;
$$;

revoke all on function public.get_workspace_invitation_preview(text) from public;
grant execute on function public.get_workspace_invitation_preview(text) to anon, authenticated;

-- Keep legacy lookup working for old workspace_members.invite_token rows
create or replace function public.get_pending_invite(p_token text)
returns table (
  id uuid,
  workspace_id uuid,
  role public.member_role,
  invite_email text,
  invitation_status public.invitation_status
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hash text := public.hash_invite_token(p_token);
begin
  if exists (
    select 1
    from public.workspace_invitations i
    where i.token_hash = v_hash
      and i.status = 'pending'
      and i.expires_at >= timezone('utc', now())
  ) then
    return query
    select
      i.id,
      i.workspace_id,
      i.role,
      i.email,
      'pending'::public.invitation_status
    from public.workspace_invitations i
    where i.token_hash = v_hash
      and i.status = 'pending'
      and i.expires_at >= timezone('utc', now())
    limit 1;
    return;
  end if;

  -- Legacy pending member invites
  return query
  select
    wm.id,
    wm.workspace_id,
    wm.role,
    wm.invite_email,
    wm.invitation_status
  from public.workspace_members wm
  where wm.invite_token = p_token
    and wm.invitation_status = 'pending'
  limit 1;
end;
$$;

-- Create partner invitation + outbox row (returns raw token once)
create or replace function public.create_partner_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role public.member_role default 'partner',
  p_expires_days integer default 14,
  p_site_url text default null,
  p_inviter_name text default null,
  p_workspace_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(p_email));
  v_raw text;
  v_hash text;
  v_invite_id uuid;
  v_expires timestamptz;
  v_now timestamptz := timezone('utc', now());
  v_site text;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'invalid_partner_email';
  end if;

  if not (
    public.is_workspace_owner(p_workspace_id)
    or public.has_workspace_role(p_workspace_id, array['owner', 'partner', 'admin']::public.member_role[])
    or public.is_platform_admin()
  ) then
    raise exception 'forbidden';
  end if;

  -- Idempotent: reuse pending invite for same email
  select i.id into v_existing
  from public.workspace_invitations i
  where i.workspace_id = p_workspace_id
    and i.email = v_email
    and i.status = 'pending'
    and i.expires_at >= v_now
  limit 1;

  if v_existing is not null then
    return jsonb_build_object(
      'invitation_id', v_existing,
      'reused', true,
      'raw_token', null
    );
  end if;

  v_raw := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := public.hash_invite_token(v_raw);
  v_expires := v_now + make_interval(days => greatest(coalesce(p_expires_days, 14), 1));
  v_site := nullif(trim(trailing '/' from coalesce(p_site_url, '')), '');

  insert into public.workspace_invitations (
    workspace_id, email, role, token_hash, status, invited_by, expires_at
  ) values (
    p_workspace_id, v_email, coalesce(p_role, 'partner'), v_hash, 'pending', v_uid, v_expires
  )
  returning id into v_invite_id;

  if v_site is not null then
    insert into public.email_outbox (
      workspace_id, event_type, recipient, payload, status, scheduled_at
    ) values (
      p_workspace_id,
      'partner_invite',
      v_email,
      jsonb_build_object(
        'invitation_id', v_invite_id,
        'invite_url', v_site || '/invite/' || v_raw,
        'role', coalesce(p_role, 'partner')::text,
        'inviter_name', coalesce(p_inviter_name, ''),
        'workspace_name', coalesce(p_workspace_name, ''),
        'expires_at', v_expires
      ),
      'pending',
      v_now
    );
  end if;

  return jsonb_build_object(
    'invitation_id', v_invite_id,
    'reused', false,
    'raw_token', v_raw,
    'expires_at', v_expires
  );
end;
$$;

revoke all on function public.create_partner_invitation(uuid, text, public.member_role, integer, text, text, text) from public;
grant execute on function public.create_partner_invitation(uuid, text, public.member_role, integer, text, text, text) to authenticated;

-- Accept invitation (security definer — bypasses RLS update gap)
create or replace function public.accept_workspace_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hash text := public.hash_invite_token(p_token);
  v_invite public.workspace_invitations%rowtype;
  v_member_id uuid;
  v_now timestamptz := timezone('utc', now());
  v_user_email text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select lower(coalesce(u.email, '')) into v_user_email
  from auth.users u where u.id = v_uid;

  -- New invitations table
  select * into v_invite
  from public.workspace_invitations i
  where i.token_hash = v_hash
  for update;

  if found then
    if v_invite.status = 'accepted' then
      raise exception 'invite_already_accepted';
    end if;
    if v_invite.status = 'revoked' then
      raise exception 'invite_revoked';
    end if;
    if v_invite.status <> 'pending' or v_invite.expires_at < v_now then
      update public.workspace_invitations
      set status = 'expired', updated_at = v_now
      where id = v_invite.id and status = 'pending';
      raise exception 'invite_expired';
    end if;
    if v_invite.email <> v_user_email then
      raise exception 'invite_email_mismatch';
    end if;

    -- Ensure profile exists
    insert into public.profiles (id, email, created_at, updated_at)
    select u.id, coalesce(u.email, ''), coalesce(u.created_at, v_now), v_now
    from auth.users u where u.id = v_uid
    on conflict (id) do nothing;

    insert into public.workspace_members (
      workspace_id, user_id, role, invited_by, invitation_status, invite_email
    ) values (
      v_invite.workspace_id, v_uid, v_invite.role, v_invite.invited_by, 'accepted', v_invite.email
    )
    on conflict (workspace_id, user_id) do update
    set
      role = excluded.role,
      invitation_status = 'accepted',
      invite_email = excluded.invite_email
    returning id into v_member_id;

    update public.workspace_invitations
    set
      status = 'accepted',
      accepted_at = v_now,
      accepted_user_id = v_uid,
      updated_at = v_now
    where id = v_invite.id;

    update public.profiles
    set onboarding_completed = true, updated_at = v_now
    where id = v_uid;

    insert into public.audit_logs (
      workspace_id, user_id, action, entity_type, entity_id, metadata
    ) values (
      v_invite.workspace_id, v_uid, 'invite.accepted', 'workspace_invitation', v_invite.id,
      jsonb_build_object('role', v_invite.role)
    );

    return jsonb_build_object(
      'workspace_id', v_invite.workspace_id,
      'member_id', v_member_id,
      'role', v_invite.role
    );
  end if;

  -- Legacy workspace_members.invite_token
  declare
    v_legacy public.workspace_members%rowtype;
  begin
    select * into v_legacy
    from public.workspace_members wm
    where wm.invite_token = p_token
      and wm.invitation_status = 'pending'
    for update;

    if not found then
      raise exception 'invite_not_found';
    end if;

    if v_legacy.invite_email is not null
       and lower(v_legacy.invite_email) <> v_user_email then
      raise exception 'invite_email_mismatch';
    end if;

    insert into public.profiles (id, email, created_at, updated_at)
    select u.id, coalesce(u.email, ''), coalesce(u.created_at, v_now), v_now
    from auth.users u where u.id = v_uid
    on conflict (id) do nothing;

    update public.workspace_members
    set
      user_id = v_uid,
      invitation_status = 'accepted',
      invite_token = null
    where id = v_legacy.id;

    update public.profiles
    set onboarding_completed = true, updated_at = v_now
    where id = v_uid;

    insert into public.audit_logs (
      workspace_id, user_id, action, entity_type, entity_id, metadata
    ) values (
      v_legacy.workspace_id, v_uid, 'invite.accepted', 'workspace_member', v_legacy.id,
      jsonb_build_object('role', v_legacy.role, 'legacy', true)
    );

    return jsonb_build_object(
      'workspace_id', v_legacy.workspace_id,
      'member_id', v_legacy.id,
      'role', v_legacy.role
    );
  end;
end;
$$;

revoke all on function public.accept_workspace_invitation(text) from public;
grant execute on function public.accept_workspace_invitation(text) to authenticated;

-- Claim pending outbox rows for a workspace (owner/admin)
create or replace function public.claim_email_outbox(
  p_workspace_id uuid,
  p_limit integer default 10
)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not (
    public.is_workspace_owner(p_workspace_id)
    or public.is_platform_admin()
  ) then
    raise exception 'forbidden';
  end if;

  return query
  with picked as (
    select e.id
    from public.email_outbox e
    where e.workspace_id = p_workspace_id
      and e.status in ('pending', 'failed')
      and e.scheduled_at <= timezone('utc', now())
      and e.attempt_count < 8
    order by e.scheduled_at asc
    limit greatest(coalesce(p_limit, 10), 1)
    for update skip locked
  )
  update public.email_outbox e
  set
    status = 'processing',
    attempt_count = e.attempt_count + 1,
    updated_at = timezone('utc', now())
  from picked
  where e.id = picked.id
  returning e.*;
end;
$$;

revoke all on function public.claim_email_outbox(uuid, integer) from public;
grant execute on function public.claim_email_outbox(uuid, integer) to authenticated;

create or replace function public.mark_email_outbox(
  p_id uuid,
  p_ok boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select workspace_id into v_workspace from public.email_outbox where id = p_id;
  if v_workspace is null then
    return;
  end if;

  if not (
    public.is_workspace_owner(v_workspace)
    or public.is_platform_admin()
  ) then
    raise exception 'forbidden';
  end if;

  if p_ok then
    update public.email_outbox
    set
      status = 'sent',
      sent_at = timezone('utc', now()),
      last_error = null,
      -- scrub invite URL / raw token from payload after send
      payload = payload - 'invite_url',
      updated_at = timezone('utc', now())
    where id = p_id;
  else
    update public.email_outbox
    set
      status = 'failed',
      last_error = left(coalesce(p_error, 'send_failed'), 500),
      scheduled_at = timezone('utc', now()) + make_interval(mins => least(attempt_count * 5, 60)),
      updated_at = timezone('utc', now())
    where id = p_id;
  end if;
end;
$$;

revoke all on function public.mark_email_outbox(uuid, boolean, text) from public;
grant execute on function public.mark_email_outbox(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Recreate onboarding RPC with optional partner invite
-- ---------------------------------------------------------------------------
drop function if exists public.create_onboarding_workspace(
  text, text, public.workspace_type, text, text, date, text, text, integer, boolean, text, integer
);

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
  v_trial_ends timestamptz;
  v_now timestamptz := timezone('utc', now());
  v_feature_keys text[] := array[
    'planner', 'invitations', 'website', 'guests', 'budget', 'vendors',
    'guest_limit', 'invitation_projects', 'remove_branding', 'pdf_export',
    'website_publish', 'custom_domain', 'premium_templates', 'analytics',
    'collaborator_limit', 'storage_limit', 'wedding_limit', 'white_label'
  ];
  v_fk text;
  v_partner text := nullif(lower(trim(coalesce(p_partner_email, ''))), '');
  v_invite jsonb;
  v_inviter text;
  v_reused boolean := false;
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
      when undefined_function then null;
      when others then null;
    end;

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
  end if;

  -- Partner invite (idempotent) — never rolls back workspace on email issues
  if v_partner is not null then
    begin
      -- temporary auth context already set; call internal insert
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

revoke all on function public.create_onboarding_workspace(
  text, text, public.workspace_type, text, text, date, text, text, integer, boolean, text, integer, text, text
) from public;

grant execute on function public.create_onboarding_workspace(
  text, text, public.workspace_type, text, text, date, text, text, integer, boolean, text, integer, text, text
) to authenticated;
