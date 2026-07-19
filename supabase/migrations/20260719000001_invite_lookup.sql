-- Controlled invite lookup for acceptance flow (no guest PII exposure)
create or replace function public.get_pending_invite(p_token text)
returns table (
  id uuid,
  workspace_id uuid,
  role public.member_role,
  invite_email text,
  invitation_status public.invitation_status
)
language sql
stable
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.get_pending_invite(text) from public;
grant execute on function public.get_pending_invite(text) to anon, authenticated;
