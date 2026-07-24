-- Soft-delete columns for recoverable resource deletion.
-- Hard delete remains available via explicit admin/user actions (cascades already exist).

alter table public.wedding_sites
  add column if not exists soft_deleted_at timestamptz;

alter table public.invitation_projects
  add column if not exists soft_deleted_at timestamptz;

create index if not exists wedding_sites_soft_deleted_idx
  on public.wedding_sites (soft_deleted_at);

create index if not exists invitation_projects_soft_deleted_idx
  on public.invitation_projects (soft_deleted_at);

-- Optional undo window metadata (client can restore while soft_deleted_at is set)
comment on column public.wedding_sites.soft_deleted_at is
  'Soft delete timestamp; hard delete removes row and cascades children.';
comment on column public.invitation_projects.soft_deleted_at is
  'Soft delete timestamp; hard delete removes row and cascades children.';
