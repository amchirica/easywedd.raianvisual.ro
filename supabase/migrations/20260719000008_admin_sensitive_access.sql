-- Admin sensitive access journal

create table public.admin_access_reasons (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id uuid,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index admin_access_reasons_admin_idx on public.admin_access_reasons (admin_user_id, created_at desc);

alter table public.admin_access_reasons enable row level security;

create policy admin_access_reasons_admin on public.admin_access_reasons
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
