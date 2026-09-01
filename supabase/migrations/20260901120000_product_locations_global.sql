-- Global product locations on map + supplier link

alter table public.user_product_locations
  add column if not exists status public.content_status not null default 'pending',
  add column if not exists supplier_profile_id uuid references public.supplier_profiles (id) on delete set null,
  add column if not exists moderation_note text;

create index if not exists user_product_locations_status_idx
  on public.user_product_locations (status);

-- Public read for published pins (R6)
drop policy if exists "user_product_locations_select_own" on public.user_product_locations;

create policy "user_product_locations_select_public_or_own"
  on public.user_product_locations for select
  using (
    status = 'published'
    or user_id = (select auth.uid())
    or public.is_admin()
  );
