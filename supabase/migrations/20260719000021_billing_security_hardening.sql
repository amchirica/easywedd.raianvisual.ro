-- Billing security hardening:
-- 1) Clients must not self-write subscriptions / feature_entitlements
-- 2) stripe_events.processing_ok for process-then-ack webhook idempotency
-- 3) past_due treated as expired for entitlement sync

alter table public.stripe_events
  add column if not exists processing_ok boolean not null default false;

update public.stripe_events
set processing_ok = true
where processing_ok = false;

drop policy if exists "subscriptions_insert_owner" on public.subscriptions;
drop policy if exists "subscriptions_update_owner_or_admin" on public.subscriptions;

drop policy if exists "feature_entitlements_insert_owner" on public.feature_entitlements;
drop policy if exists "feature_entitlements_update_owner_or_admin" on public.feature_entitlements;

-- Preserve sync body from 20260719000016; only change: past_due => expired.
create or replace function public.sync_workspace_entitlements(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.billing_plans%rowtype;
  v_expired boolean := false;
  v_plan_key text := 'free';
  v_grant record;
begin
  select * into v_sub
  from public.subscriptions
  where workspace_id = p_workspace_id
    and soft_deleted_at is null
  order by created_at desc
  limit 1;

  if found then
    v_plan_key := coalesce(v_sub.plan_key, v_sub.product_key, v_sub.plan::text, 'free');

    v_expired := (
      v_sub.status in ('canceled', 'incomplete', 'past_due')
      or (v_sub.access_ends_at is not null and v_sub.access_ends_at < now())
      or (
        v_sub.status = 'trialing'
        and v_sub.trial_ends_at is not null
        and v_sub.trial_ends_at < now()
      )
    );

    if v_expired then
      v_plan_key := 'free';
      update public.subscriptions
      set
        plan_key = 'free',
        plan = 'trial',
        status = case
          when status = 'trialing' then 'canceled'
          else status
        end,
        access_source = case
          when access_source in ('stripe_subscription', 'stripe_one_time', 'admin_grant', 'partner')
            then access_source
          else 'trial'
        end,
        updated_at = now()
      where id = v_sub.id
        and soft_deleted_at is null;
    end if;
  else
    v_plan_key := 'free';
    v_expired := false;
  end if;

  select * into v_plan from public.billing_plans where key = v_plan_key;
  if not found then
    select * into v_plan from public.billing_plans where key = 'free';
  end if;

  insert into public.feature_entitlements (workspace_id, feature_key, enabled, usage_limit, usage_value)
  values
    (p_workspace_id, 'planner', true, null, 0),
    (p_workspace_id, 'guests', true, coalesce(v_plan.guest_limit, 30), 0),
    (p_workspace_id, 'guest_limit', true, coalesce(v_plan.guest_limit, 30), 0),
    (p_workspace_id, 'budget', true, null, 0),
    (p_workspace_id, 'vendors', coalesce(v_plan.vendors, false), null, 0),
    (p_workspace_id, 'seating', coalesce(v_plan.seating, false), null, 0),
    (p_workspace_id, 'invitations', coalesce(v_plan.invitations, true), null, 0),
    (p_workspace_id, 'invitation_projects', coalesce(v_plan.invitations, true), coalesce(v_plan.invitation_projects, 1), 0),
    (p_workspace_id, 'website', true, null, 0),
    (p_workspace_id, 'website_publish', coalesce(v_plan.website_publishing, false), null, 0),
    (p_workspace_id, 'pdf_export', coalesce(v_plan.pdf_export, false), null, 0),
    (p_workspace_id, 'analytics', coalesce(v_plan.analytics, false), null, 0),
    (p_workspace_id, 'remove_branding', coalesce(v_plan.remove_branding, false), null, 0),
    (p_workspace_id, 'premium_templates', coalesce(v_plan.premium_templates, false), null, 0),
    (p_workspace_id, 'custom_domain', coalesce(v_plan.custom_domain, false), null, 0),
    (p_workspace_id, 'white_label', coalesce(v_plan.white_label, false), null, 0),
    (p_workspace_id, 'storage_limit', true, coalesce(v_plan.storage_mb, 200), 0),
    (p_workspace_id, 'wedding_limit', true, coalesce(v_plan.workspace_limit, 1), 0),
    (p_workspace_id, 'collaborator_limit', true, coalesce(v_plan.collaborator_limit, 1), 0)
  on conflict (workspace_id, feature_key) do update set
    enabled = excluded.enabled,
    usage_limit = excluded.usage_limit,
    updated_at = now();

  for v_grant in
    select *
    from public.access_grants g
    where g.workspace_id = p_workspace_id
      and g.revoked_at is null
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
  loop
    insert into public.feature_entitlements (workspace_id, feature_key, enabled, usage_limit, usage_value)
    values (
      p_workspace_id,
      v_grant.feature_key,
      v_grant.enabled,
      v_grant.usage_limit,
      0
    )
    on conflict (workspace_id, feature_key) do update set
      enabled = excluded.enabled,
      usage_limit = coalesce(excluded.usage_limit, public.feature_entitlements.usage_limit),
      updated_at = now();
  end loop;
end;
$$;
