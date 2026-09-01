-- Buyer product source locations (private) + purchase location fields

alter table public.purchases
  add column if not exists purchase_lat double precision,
  add column if not exists purchase_lng double precision,
  add column if not exists purchase_location_label text;

create table if not exists public.user_product_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  purchase_id uuid references public.purchases (id) on delete set null,
  label text,
  lat double precision not null,
  lng double precision not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_product_locations_user_idx
  on public.user_product_locations (user_id);

create trigger user_product_locations_updated_at
before update on public.user_product_locations
for each row execute function public.set_updated_at();

alter table public.user_product_locations enable row level security;

create policy "user_product_locations_select_own"
  on public.user_product_locations for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "user_product_locations_insert_own"
  on public.user_product_locations for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_product_locations_update_own"
  on public.user_product_locations for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "user_product_locations_delete_own"
  on public.user_product_locations for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
