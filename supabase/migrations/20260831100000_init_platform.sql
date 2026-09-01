-- FiX Ai Platform — core schema, RLS, seed categories, storage
-- Rules: R1 visibility, R2 roles via app_metadata, R3 moderation, R4 KVKK, R7 site isolation, R8 reviews, R9 RLS

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.app_role as enum ('buyer', 'supplier', 'admin');
create type public.content_status as enum ('draft', 'pending', 'published', 'rejected', 'archived');
create type public.role_request_status as enum ('pending', 'approved', 'rejected');

-- Helpers (security definer, not in exposed logic beyond grants)
create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    'buyer'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'admin';
$$;

create or replace function public.is_supplier_or_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('supplier', 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  phone text,
  role public.app_role not null default 'buyer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'buyer'
  );
  -- app_metadata.role is set by Admin API / server actions only (R2).
  -- jwt_role() defaults to buyer when claim is missing.
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Role requests (buyer → supplier)
create table public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  requested_role public.app_role not null default 'supplier',
  note text,
  status public.role_request_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger role_requests_updated_at
before update on public.role_requests
for each row execute function public.set_updated_at();

-- Categories (hierarchical segmentation)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id);

-- Products (public_anon fields; no prices here — R1)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  weight_kg numeric(12, 3),
  length_cm numeric(12, 3),
  width_cm numeric(12, 3),
  height_cm numeric(12, 3),
  dimension_unit text not null default 'cm',
  sourced_from_text text,
  supplier_profile_id uuid,
  images text[] not null default '{}',
  description text,
  status public.content_status not null default 'pending',
  moderation_note text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index products_status_idx on public.products (status);
create index products_category_idx on public.products (category_id);

-- Product prices (public_auth only — R1)
create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'TRY',
  reported_by uuid not null references public.profiles (id) on delete cascade,
  observed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create index product_prices_product_idx on public.product_prices (product_id);

-- Product reviews (public_auth — R8: one active per user/product)
create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create trigger product_reviews_updated_at
before update on public.product_reviews
for each row execute function public.set_updated_at();

-- Supplier profiles (KVKK public whitelist — R4)
create table public.supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  org_name text not null,
  city text,
  district text,
  public_phone text,
  website text,
  category_focus text,
  kvkk_consent_at timestamptz,
  status public.content_status not null default 'pending',
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger supplier_profiles_updated_at
before update on public.supplier_profiles
for each row execute function public.set_updated_at();

alter table public.products
  add constraint products_supplier_profile_fk
  foreign key (supplier_profile_id) references public.supplier_profiles (id) on delete set null;

-- Supplier map pins
create table public.supplier_locations (
  id uuid primary key default gen_random_uuid(),
  supplier_profile_id uuid not null references public.supplier_profiles (id) on delete cascade,
  label text,
  lat double precision not null,
  lng double precision not null,
  status public.content_status not null default 'pending',
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger supplier_locations_updated_at
before update on public.supplier_locations
for each row execute function public.set_updated_at();

create index supplier_locations_status_idx on public.supplier_locations (status);

-- Service reviews (for supplier)
create table public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  supplier_profile_id uuid not null references public.supplier_profiles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_profile_id, user_id)
);

create trigger service_reviews_updated_at
before update on public.service_reviews
for each row execute function public.set_updated_at();

-- Sites (private — R7)
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sites_updated_at
before update on public.sites
for each row execute function public.set_updated_at();

create index sites_owner_idx on public.sites (owner_id);

-- Site stock
create table public.site_stock (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  qty numeric(14, 3) not null default 0,
  unit text not null default 'adet',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_stock_updated_at
before update on public.site_stock
for each row execute function public.set_updated_at();

-- Purchases
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  qty numeric(14, 3) not null,
  unit text not null default 'adet',
  unit_price numeric(14, 2),
  currency text not null default 'TRY',
  purchased_at date not null default current_date,
  supplier_ref text,
  notes text,
  created_at timestamptz not null default now()
);

-- Purchase list ("Satın Alınacaklar")
create table public.purchase_list_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  qty numeric(14, 3) not null default 1,
  unit text not null default 'adet',
  priority int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger purchase_list_items_updated_at
before update on public.purchase_list_items
for each row execute function public.set_updated_at();

-- Site ownership helper
create or replace function public.owns_site(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sites s
    where s.id = p_site_id
      and s.owner_id = auth.uid()
      and s.archived_at is null
  ) or public.is_admin();
$$;

-- ===================== RLS =====================
alter table public.profiles enable row level security;
alter table public.role_requests enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.product_reviews enable row level security;
alter table public.supplier_profiles enable row level security;
alter table public.supplier_locations enable row level security;
alter table public.service_reviews enable row level security;
alter table public.sites enable row level security;
alter table public.site_stock enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_list_items enable row level security;

-- profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- role_requests
create policy "role_requests_select_own_or_admin"
  on public.role_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "role_requests_insert_own"
  on public.role_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and requested_role = 'supplier');

create policy "role_requests_admin_update"
  on public.role_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- categories: public read, admin write
create policy "categories_select_all"
  on public.categories for select
  using (true);

create policy "categories_admin_all"
  on public.categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- products: anon/auth see published; owner sees own; admin all
create policy "products_select_published_or_own"
  on public.products for select
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or public.is_admin()
  );

create policy "products_insert_auth"
  on public.products for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "products_update_own_or_admin"
  on public.products for update to authenticated
  using (created_by = (select auth.uid()) or public.is_admin())
  with check (created_by = (select auth.uid()) or public.is_admin());

create policy "products_delete_admin"
  on public.products for delete to authenticated
  using (public.is_admin());

-- product_prices: authenticated only
create policy "product_prices_select_auth"
  on public.product_prices for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (p.status = 'published' or p.created_by = (select auth.uid()) or public.is_admin())
    )
  );

create policy "product_prices_insert_auth"
  on public.product_prices for insert to authenticated
  with check (reported_by = (select auth.uid()));

create policy "product_prices_delete_own_or_admin"
  on public.product_prices for delete to authenticated
  using (reported_by = (select auth.uid()) or public.is_admin());

-- product_reviews: authenticated select published / own
create policy "product_reviews_select_auth"
  on public.product_reviews for select to authenticated
  using (status = 'published' or user_id = (select auth.uid()) or public.is_admin());

create policy "product_reviews_insert_auth"
  on public.product_reviews for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "product_reviews_update_own_or_admin"
  on public.product_reviews for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

-- supplier_profiles: published + consent for public; owner; admin
create policy "supplier_profiles_select_public_or_own"
  on public.supplier_profiles for select
  using (
    (status = 'published' and kvkk_consent_at is not null)
    or user_id = (select auth.uid())
    or public.is_admin()
  );

create policy "supplier_profiles_insert_own"
  on public.supplier_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "supplier_profiles_update_own_or_admin"
  on public.supplier_profiles for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

-- supplier_locations
create policy "supplier_locations_select_published_or_own"
  on public.supplier_locations for select
  using (
    status = 'published'
    or public.is_admin()
    or exists (
      select 1 from public.supplier_profiles sp
      where sp.id = supplier_profile_id and sp.user_id = (select auth.uid())
    )
  );

create policy "supplier_locations_insert_owner"
  on public.supplier_locations for insert to authenticated
  with check (
    exists (
      select 1 from public.supplier_profiles sp
      where sp.id = supplier_profile_id and sp.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

create policy "supplier_locations_update_owner_or_admin"
  on public.supplier_locations for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.supplier_profiles sp
      where sp.id = supplier_profile_id and sp.user_id = (select auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.supplier_profiles sp
      where sp.id = supplier_profile_id and sp.user_id = (select auth.uid())
    )
  );

-- service_reviews
create policy "service_reviews_select_auth"
  on public.service_reviews for select to authenticated
  using (status = 'published' or user_id = (select auth.uid()) or public.is_admin());

create policy "service_reviews_insert_auth"
  on public.service_reviews for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "service_reviews_update_own_or_admin"
  on public.service_reviews for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

-- sites private
create policy "sites_select_own"
  on public.sites for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

create policy "sites_insert_own"
  on public.sites for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "sites_update_own"
  on public.sites for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "sites_delete_admin"
  on public.sites for delete to authenticated
  using (public.is_admin());

-- site_stock via owns_site
create policy "site_stock_all_owner"
  on public.site_stock for all to authenticated
  using (public.owns_site(site_id))
  with check (public.owns_site(site_id));

create policy "purchases_all_owner"
  on public.purchases for all to authenticated
  using (public.owns_site(site_id))
  with check (public.owns_site(site_id));

create policy "purchase_list_all_owner"
  on public.purchase_list_items for all to authenticated
  using (public.owns_site(site_id))
  with check (public.owns_site(site_id));

-- Storage buckets
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('private-attachments', 'private-attachments', false)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_auth_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "product_images_owner_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "product_images_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "private_attachments_owner"
  on storage.objects for all to authenticated
  using (bucket_id = 'private-attachments' and (select auth.uid())::text = (storage.foldername(name))[1])
  with check (bucket_id = 'private-attachments' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- Seed categories
insert into public.categories (slug, name, parent_id, sort_order) values
  ('insaat', 'İnşaat malzemeleri', null, 10),
  ('yapi', 'Yapı', null, 20),
  ('tamirat', 'Tamirat', null, 30),
  ('ic-mimari', 'İç mimari', null, 40),
  ('dis-mimari', 'Dış mimari', null, 50);

insert into public.categories (slug, name, parent_id, sort_order)
select v.slug, v.name, c.id, v.sort_order
from (values
  ('cimento', 'Çimento', 'insaat', 1),
  ('agrega', 'Agrega', 'insaat', 2),
  ('demir', 'Demir / Donatı', 'insaat', 3),
  ('tugla-blok', 'Tuğla / Blok', 'insaat', 4),
  ('izolasyon', 'İzolasyon', 'insaat', 5),
  ('dograma', 'Doğrama', 'yapi', 1),
  ('cati', 'Çatı', 'yapi', 2),
  ('tesisat', 'Tesisat', 'tamirat', 1),
  ('elektrik', 'Elektrik', 'tamirat', 2),
  ('boya', 'Boya', 'tamirat', 3),
  ('zemin', 'Zemin', 'ic-mimari', 1),
  ('duvar', 'Duvar', 'ic-mimari', 2),
  ('mobilya', 'Mobilya', 'ic-mimari', 3),
  ('cephe', 'Cephe', 'dis-mimari', 1),
  ('peyzaj', 'Peyzaj', 'dis-mimari', 2)
) as v(slug, name, parent_slug, sort_order)
join public.categories c on c.slug = v.parent_slug;
