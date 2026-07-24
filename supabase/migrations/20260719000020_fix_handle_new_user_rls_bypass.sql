-- Fix signup HTTP 500 from on_auth_user_created → handle_new_user().
--
-- Exact root cause:
-- During signup the Auth service inserts into auth.users with no JWT, so auth.uid()
-- is NULL. public.profiles has RLS enabled and policy profiles_insert_own
-- (WITH CHECK id = auth.uid()). If handle_new_user does not reliably bypass RLS
-- (function owner / row_security), the profile INSERT is rejected and Auth returns
-- HTTP 500 ("Database error saving new user").
--
-- Fix: SECURITY DEFINER + row_security=off + owner postgres + explicit enum cast.

-- ---------------------------------------------------------------------------
-- 1) Ensure account_status exists (idempotent)
-- ---------------------------------------------------------------------------
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
  add column if not exists account_status_updated_by uuid references public.profiles (id) on delete set null,
  add column if not exists suspended_at timestamptz,
  add column if not exists soft_deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2) handle_new_user — idempotent, RLS-bypass, explicit enum
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to public
set row_security to off
as $function$
declare
  v_full_name text;
  v_email text;
begin
  perform set_config('row_security', 'off', true);

  v_email := coalesce(nullif(trim(new.email), ''), '');
  v_full_name := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      )
    ),
    ''
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    account_status,
    onboarding_completed,
    locale,
    timezone,
    created_at,
    updated_at
  )
  values (
    new.id,
    v_email,
    v_full_name,
    'limited'::public.account_status,
    false,
    'ro',
    'Europe/Bucharest',
    coalesce(new.created_at, timezone('utc', now())),
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = timezone('utc', now());

  return new;
exception
  when others then
    raise exception
      'handle_new_user failed (SQLSTATE %): %',
      sqlstate,
      sqlerrm
      using errcode = sqlstate;
end;
$function$;

do $$
begin
  alter function public.handle_new_user() owner to postgres;
exception when insufficient_privilege then
  raise notice 'could not set handle_new_user owner to postgres (continuing)';
end $$;

revoke all on function public.handle_new_user() from public;

do $$
begin
  grant execute on function public.handle_new_user() to supabase_auth_admin;
exception when undefined_object then
  raise notice 'role supabase_auth_admin missing — skip grant';
end $$;

grant execute on function public.handle_new_user() to postgres;

-- ---------------------------------------------------------------------------
-- 3) Trigger exactly once
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4) ensure_own_profile — same bypass + enum
-- ---------------------------------------------------------------------------
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path to public
set row_security to off
as $function$
declare
  v_uid uuid := auth.uid();
  v_result public.profiles;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform set_config('row_security', 'off', true);

  insert into public.profiles (
    id,
    email,
    full_name,
    account_status,
    onboarding_completed,
    locale,
    timezone,
    created_at,
    updated_at
  )
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
    'limited'::public.account_status,
    false,
    'ro',
    'Europe/Bucharest',
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
$function$;

do $$
begin
  alter function public.ensure_own_profile() owner to postgres;
exception when insufficient_privilege then
  raise notice 'could not set ensure_own_profile owner to postgres (continuing)';
end $$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;
grant execute on function public.ensure_own_profile() to service_role;

-- ---------------------------------------------------------------------------
-- 5) Validation (no auth.users insert — schema differs by Supabase version)
-- ---------------------------------------------------------------------------
do $verify$
declare
  v_trigger_count int;
  v_config text[];
  v_prosecdef boolean;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'account_status'
  ) then
    raise exception 'verify failed: profiles.account_status missing';
  end if;

  perform 'limited'::public.account_status;
  perform 'pending'::public.account_status;
  perform 'approved'::public.account_status;
  perform 'suspended'::public.account_status;

  select count(*)::int into v_trigger_count
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth'
    and c.relname = 'users'
    and not t.tgisinternal
    and t.tgname = 'on_auth_user_created';

  if v_trigger_count <> 1 then
    raise exception 'verify failed: expected 1 on_auth_user_created, found %', v_trigger_count;
  end if;

  select p.prosecdef, p.proconfig
  into v_prosecdef, v_config
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'handle_new_user';

  if not coalesce(v_prosecdef, false) then
    raise exception 'verify failed: handle_new_user is not SECURITY DEFINER';
  end if;

  if v_config is null
     or not exists (
       select 1
       from unnest(v_config) cfg
       where cfg ilike 'row_security=off'
     ) then
    raise exception 'verify failed: handle_new_user missing SET row_security=off';
  end if;

  raise notice 'handle_new_user verified: SECURITY DEFINER, row_security=off, trigger=1, account_status=ok';
end;
$verify$;
