-- Product analytics (operational, not industry)

create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index product_events_name_idx on public.product_events (event_name, occurred_at desc);
create index product_events_workspace_idx on public.product_events (workspace_id, occurred_at desc);

alter table public.product_events enable row level security;

create policy product_events_insert on public.product_events
for insert to authenticated
with check (
  workspace_id is null
  or public.is_workspace_member(workspace_id)
  or public.is_platform_admin()
);

create policy product_events_select_member on public.product_events
for select to authenticated
using (
  public.is_platform_admin()
  or (workspace_id is not null and public.is_workspace_member(workspace_id))
);
