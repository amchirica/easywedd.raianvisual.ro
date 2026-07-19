-- Industry insights (anonymized, consent-gated) + GDPR + email prefs
-- Retention: operational product_events 24 months; industry_metrics_monthly indefinite
-- (already anonymized aggregates). Opt-out via consent revoke excludes future aggregation.

create table public.industry_metrics_monthly (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  region text not null default 'RO',
  wedding_count integer not null default 0,
  average_budget numeric(14, 2),
  median_budget numeric(14, 2),
  average_guest_count numeric(10, 2),
  average_cost_per_guest numeric(12, 2),
  category_distribution jsonb not null default '{}'::jsonb,
  season_distribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint industry_metrics_period_region unique (period, region)
);

alter table public.industry_metrics_monthly enable row level security;

create policy industry_metrics_admin_select on public.industry_metrics_monthly
for select to authenticated
using (public.is_platform_admin());

create policy industry_metrics_admin_write on public.industry_metrics_monthly
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create or replace function public.refresh_industry_metrics_monthly(p_period text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  period_key text := coalesce(p_period, to_char(timezone('utc', now()), 'YYYY-MM'));
  min_n integer := 20;
  inserted integer := 0;
  wcount integer;
  avg_budget numeric;
  med_budget numeric;
  avg_guests numeric;
  avg_cpg numeric;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden';
  end if;

  -- Workspaces with active anonymized_industry_research consent
  with consented as (
    select distinct uc.workspace_id
    from public.user_consents uc
    where uc.consent_type = 'anonymized_industry_research'
      and uc.granted = true
      and uc.revoked_at is null
      and uc.workspace_id is not null
  ),
  wedding_base as (
    select
      w.id as wedding_id,
      w.workspace_id,
      coalesce(w.city, 'RO') as region_raw,
      w.wedding_date,
      coalesce((
        select sum(bi.estimated_amount)
        from public.budget_items bi
        where bi.wedding_id = w.id
      ), 0) as total_budget,
      coalesce((
        select count(*)::numeric from public.guests g where g.wedding_id = w.id
      ), 0) as guest_count
    from public.weddings w
    join consented c on c.workspace_id = w.workspace_id
  ),
  national as (
    select
      count(*)::integer as wedding_count,
      avg(total_budget) as average_budget,
      percentile_cont(0.5) within group (order by total_budget) as median_budget,
      avg(guest_count) as average_guest_count,
      avg(case when guest_count > 0 then total_budget / guest_count else null end) as average_cost_per_guest
    from wedding_base
  )
  select wedding_count, average_budget, median_budget, average_guest_count, average_cost_per_guest
  into wcount, avg_budget, med_budget, avg_guests, avg_cpg
  from national;

  if coalesce(wcount, 0) < min_n then
    -- Do not publish small cohorts
    return 0;
  end if;

  insert into public.industry_metrics_monthly (
    period, region, wedding_count, average_budget, median_budget,
    average_guest_count, average_cost_per_guest, category_distribution, season_distribution
  )
  values (
    period_key, 'RO', wcount, avg_budget, med_budget, avg_guests, avg_cpg,
    '{}'::jsonb, '{}'::jsonb
  )
  on conflict (period, region) do update set
    wedding_count = excluded.wedding_count,
    average_budget = excluded.average_budget,
    median_budget = excluded.median_budget,
    average_guest_count = excluded.average_guest_count,
    average_cost_per_guest = excluded.average_cost_per_guest,
    created_at = timezone('utc', now());

  inserted := 1;
  return inserted;
end;
$$;

revoke all on function public.refresh_industry_metrics_monthly(text) from public;
grant execute on function public.refresh_industry_metrics_monthly(text) to authenticated;

create type public.gdpr_request_type as enum ('export', 'delete', 'anonymize', 'consent_revoke');
create type public.gdpr_request_status as enum ('pending', 'processing', 'completed', 'rejected');

create table public.gdpr_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  request_type public.gdpr_request_type not null,
  status public.gdpr_request_status not null default 'pending',
  notes text,
  result_payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

alter table public.gdpr_requests enable row level security;

create policy gdpr_requests_own on public.gdpr_requests
for all to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());

create table public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  transactional_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  reminders_enabled boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.email_preferences enable row level security;

create policy email_preferences_own on public.email_preferences
for all to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());
