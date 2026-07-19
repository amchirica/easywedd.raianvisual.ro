-- Deduplicate user_consents + history; allow platform admin writes on planner tables

create table if not exists public.user_consent_history (
  id uuid primary key default gen_random_uuid(),
  original_id uuid,
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  consent_type public.consent_type not null,
  consent_version text not null,
  granted boolean not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  source text,
  created_at timestamptz not null default now(),
  archived_at timestamptz not null default now(),
  archive_reason text not null default 'dedupe'
);

create index if not exists user_consent_history_user_idx
  on public.user_consent_history (user_id);

alter table public.user_consent_history enable row level security;

drop policy if exists "user_consent_history_admin_select" on public.user_consent_history;
create policy "user_consent_history_admin_select"
on public.user_consent_history for select
to authenticated
using (public.is_platform_admin() or user_id = auth.uid());

with ranked as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        consent_type,
        consent_version,
        coalesce(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid)
      order by created_at desc, id desc
    ) as rn
  from public.user_consents
),
dupes as (
  select c.*
  from public.user_consents c
  join ranked r on r.id = c.id
  where r.rn > 1
)
insert into public.user_consent_history (
  original_id, user_id, workspace_id, consent_type, consent_version,
  granted, granted_at, revoked_at, source, created_at, archive_reason
)
select
  d.id, d.user_id, d.workspace_id, d.consent_type, d.consent_version,
  d.granted, d.granted_at, d.revoked_at, d.source, d.created_at, 'dedupe'
from dupes d;

delete from public.user_consents c
using (
  select id
  from (
    select
      id,
      row_number() over (
        partition by
          user_id,
          consent_type,
          consent_version,
          coalesce(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid)
        order by created_at desc, id desc
      ) as rn
    from public.user_consents
  ) x
  where x.rn > 1
) doomed
where c.id = doomed.id;

-- PG15+: treat NULL workspace_id as equal for uniqueness
alter table public.user_consents
  drop constraint if exists user_consents_unique_effective;

alter table public.user_consents
  add constraint user_consents_unique_effective
  unique nulls not distinct (user_id, workspace_id, consent_type, consent_version);

-- Guest writes + admin
drop policy if exists guests_write on public.guests;
create policy guests_write on public.guests for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists guest_groups_write on public.guest_groups;
create policy guest_groups_write on public.guest_groups for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists guest_companions_write on public.guest_companions;
create policy guest_companions_write on public.guest_companions for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists guest_events_write on public.guest_events;
create policy guest_events_write on public.guest_events for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists rsvp_responses_write on public.rsvp_responses;
create policy rsvp_responses_write on public.rsvp_responses for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists rsvp_tokens_write on public.rsvp_tokens;
create policy rsvp_tokens_write on public.rsvp_tokens for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists venue_layouts_write on public.venue_layouts;
create policy venue_layouts_write on public.venue_layouts for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists tables_write on public.tables;
create policy tables_write on public.tables for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

drop policy if exists table_assignments_write on public.table_assignments;
create policy table_assignments_write on public.table_assignments for all to authenticated
using (public.can_manage_guests(workspace_id) or public.is_platform_admin())
with check (public.can_manage_guests(workspace_id) or public.is_platform_admin());

-- Planner writes + admin
drop policy if exists wedding_tasks_write on public.wedding_tasks;
create policy wedding_tasks_write on public.wedding_tasks for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists wedding_task_checklist_write on public.wedding_task_checklist_items;
create policy wedding_task_checklist_write on public.wedding_task_checklist_items for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists budget_categories_write on public.budget_categories;
create policy budget_categories_write on public.budget_categories for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists budget_items_write on public.budget_items;
create policy budget_items_write on public.budget_items for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists payments_write on public.payments;
create policy payments_write on public.payments for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists exchange_rates_write on public.exchange_rates;
create policy exchange_rates_write on public.exchange_rates for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists vendor_categories_write on public.vendor_categories;
create policy vendor_categories_write on public.vendor_categories for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists vendors_write on public.vendors;
create policy vendors_write on public.vendors for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists vendor_contacts_write on public.vendor_contacts;
create policy vendor_contacts_write on public.vendor_contacts for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists vendor_documents_write on public.vendor_documents;
create policy vendor_documents_write on public.vendor_documents for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists vendor_reviews_write on public.vendor_reviews_private;
create policy vendor_reviews_write on public.vendor_reviews_private for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists timeline_write on public.wedding_timeline_items;
create policy timeline_write on public.wedding_timeline_items for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists contacts_write on public.wedding_contacts;
create policy contacts_write on public.wedding_contacts for all to authenticated
using (public.can_manage_planner(workspace_id) or public.is_platform_admin())
with check (public.can_manage_planner(workspace_id) or public.is_platform_admin());

drop policy if exists "weddings_update_planner" on public.weddings;
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
