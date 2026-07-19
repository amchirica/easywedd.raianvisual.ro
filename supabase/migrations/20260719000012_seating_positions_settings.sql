-- Table positions for 2D seating planner
-- Harden wedding updates to planner roles

alter table public.tables
  add column if not exists pos_x double precision not null default 80,
  add column if not exists pos_y double precision not null default 80;

comment on column public.tables.pos_x is 'Canvas X position (px) for 2D seating planner';
comment on column public.tables.pos_y is 'Canvas Y position (px) for 2D seating planner';

drop policy if exists "weddings_update_member" on public.weddings;
drop policy if exists "weddings_update" on public.weddings;

create policy "weddings_update_planner"
on public.weddings for update
to authenticated
using (
  public.can_manage_planner(workspace_id)
  or public.is_platform_admin()
)
with check (
  public.can_manage_planner(workspace_id)
  or public.is_platform_admin()
);
