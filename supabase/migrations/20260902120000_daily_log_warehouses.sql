-- Daily log: warehouses entity + extend site_progress_entries for optional site/warehouse tags

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  address text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger warehouses_updated_at
before update on public.warehouses
for each row execute function public.set_updated_at();

create index warehouses_owner_idx on public.warehouses (owner_id);

create or replace function public.owns_warehouse(p_warehouse_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.warehouses w
    where w.id = p_warehouse_id
      and w.owner_id = auth.uid()
      and w.archived_at is null
  ) or public.is_admin();
$$;

revoke all on function public.owns_warehouse(uuid) from public, anon;
grant execute on function public.owns_warehouse(uuid) to authenticated;

alter table public.warehouses enable row level security;

create policy "warehouses_all_owner"
  on public.warehouses for all to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- Extend site_progress_entries (daily log entries)
alter table public.site_progress_entries
  alter column site_id drop not null;

alter table public.site_progress_entries
  add column warehouse_id uuid references public.warehouses (id) on delete set null;

alter table public.site_progress_entries
  drop constraint if exists site_progress_entries_note_check;

alter table public.site_progress_entries
  add constraint site_progress_entries_note_check
  check (note is null or char_length(note) <= 5000);

create index site_progress_entries_warehouse_logged_idx
  on public.site_progress_entries (warehouse_id, logged_at desc)
  where archived_at is null and warehouse_id is not null;

-- Replace RLS policies for entries
drop policy if exists "site_progress_entries_all_owner" on public.site_progress_entries;

create policy "site_progress_entries_all_owner"
  on public.site_progress_entries for all to authenticated
  using (
    public.is_admin()
    or (site_id is not null and public.owns_site(site_id))
    or (warehouse_id is not null and public.owns_warehouse(warehouse_id))
    or (site_id is null and warehouse_id is null and created_by = auth.uid())
  )
  with check (
    public.is_admin()
    or (site_id is not null and public.owns_site(site_id))
    or (warehouse_id is not null and public.owns_warehouse(warehouse_id))
    or (site_id is null and warehouse_id is null and created_by = auth.uid())
  );

-- Replace RLS policies for photos
drop policy if exists "site_progress_photos_all_owner" on public.site_progress_photos;

create policy "site_progress_photos_all_owner"
  on public.site_progress_photos for all to authenticated
  using (
    exists (
      select 1
      from public.site_progress_entries e
      where e.id = entry_id
        and (
          public.is_admin()
          or (e.site_id is not null and public.owns_site(e.site_id))
          or (e.warehouse_id is not null and public.owns_warehouse(e.warehouse_id))
          or (e.site_id is null and e.warehouse_id is null and e.created_by = auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.site_progress_entries e
      where e.id = entry_id
        and (
          public.is_admin()
          or (e.site_id is not null and public.owns_site(e.site_id))
          or (e.warehouse_id is not null and public.owns_warehouse(e.warehouse_id))
          or (e.site_id is null and e.warehouse_id is null and e.created_by = auth.uid())
        )
    )
  );
