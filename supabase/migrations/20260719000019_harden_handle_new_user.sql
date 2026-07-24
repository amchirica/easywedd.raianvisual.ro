-- Harden auth.users → profiles trigger (signup HTTP 500 = trigger/SMTP failure).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
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

  begin
    insert into public.profiles (
      id,
      email,
      full_name,
      account_status,
      created_at,
      updated_at
    )
    values (
      new.id,
      coalesce(new.email, ''),
      v_full_name,
      'limited',
      coalesce(new.created_at, timezone('utc', now())),
      timezone('utc', now())
    )
    on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = timezone('utc', now());
  exception
    when undefined_column then
      -- account_status not migrated yet
      insert into public.profiles (id, email, full_name, created_at, updated_at)
      values (
        new.id,
        coalesce(new.email, ''),
        v_full_name,
        coalesce(new.created_at, timezone('utc', now())),
        timezone('utc', now())
      )
      on conflict (id) do update
      set
        email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = timezone('utc', now());
    when undefined_object then
      insert into public.profiles (id, email, full_name, created_at, updated_at)
      values (
        new.id,
        coalesce(new.email, ''),
        v_full_name,
        coalesce(new.created_at, timezone('utc', now())),
        timezone('utc', now())
      )
      on conflict (id) do update
      set
        email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = timezone('utc', now());
  end;

  return new;
exception
  when others then
    raise exception 'handle_new_user failed: %', sqlerrm
      using errcode = 'P0001';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
