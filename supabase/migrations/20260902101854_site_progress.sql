-- R7 site progress diary: dated photo entries per site (private)

create table public.site_progress_entries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  logged_at date not null default current_date,
  note text check (note is null or char_length(note) <= 500),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_progress_entries_updated_at
before update on public.site_progress_entries
for each row execute function public.set_updated_at();

create index site_progress_entries_site_logged_idx
  on public.site_progress_entries (site_id, logged_at desc)
  where archived_at is null;

create table public.site_progress_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.site_progress_entries (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index site_progress_photos_entry_idx
  on public.site_progress_photos (entry_id, sort_order);

alter table public.site_progress_entries enable row level security;
alter table public.site_progress_photos enable row level security;

create policy "site_progress_entries_all_owner"
  on public.site_progress_entries for all to authenticated
  using (public.owns_site(site_id))
  with check (public.owns_site(site_id));

create policy "site_progress_photos_all_owner"
  on public.site_progress_photos for all to authenticated
  using (
    exists (
      select 1
      from public.site_progress_entries e
      where e.id = entry_id
        and public.owns_site(e.site_id)
    )
  )
  with check (
    exists (
      select 1
      from public.site_progress_entries e
      where e.id = entry_id
        and public.owns_site(e.site_id)
    )
  );
