-- Platform admin access hardening.
--
-- is_platform_admin() previously required workspace_members.role = 'admin' only.
-- Owners of the platform admin workspace (or role owner) were incorrectly denied.
-- App code never checks emails for admin access.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.workspace_members wm
      join public.workspaces w on w.id = wm.workspace_id
      where wm.user_id = auth.uid()
        and wm.invitation_status = 'accepted'
        and wm.role in ('admin', 'owner')
        and w.workspace_type = 'admin'
        and w.status = 'active'
        and w.soft_deleted_at is null
    )
    or exists (
      select 1
      from public.workspaces w
      where w.owner_id = auth.uid()
        and w.workspace_type = 'admin'
        and w.status = 'active'
        and w.soft_deleted_at is null
    );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_admin() to service_role;
