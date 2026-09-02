-- Purchase list offers, purchase invoice attachments

create table public.purchase_list_item_offers (
  id uuid primary key default gen_random_uuid(),
  list_item_id uuid not null references public.purchase_list_items (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  supplier_profile_id uuid references public.supplier_profiles (id) on delete set null,
  place_name text,
  unit_price numeric(14, 2),
  currency text not null default 'TRY',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_list_item_offers_place_or_supplier check (
    supplier_profile_id is not null
    or nullif(trim(place_name), '') is not null
  )
);

create trigger purchase_list_item_offers_updated_at
before update on public.purchase_list_item_offers
for each row execute function public.set_updated_at();

create index purchase_list_item_offers_list_item_idx
  on public.purchase_list_item_offers (list_item_id);

create table public.purchase_attachments (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  content_type text,
  byte_size int,
  created_at timestamptz not null default now()
);

create index purchase_attachments_purchase_idx
  on public.purchase_attachments (purchase_id);

alter table public.purchase_list_item_offers enable row level security;
alter table public.purchase_attachments enable row level security;

create policy "purchase_list_item_offers_all_owner"
  on public.purchase_list_item_offers for all to authenticated
  using (public.owns_site(site_id))
  with check (public.owns_site(site_id));

create policy "purchase_attachments_all_owner"
  on public.purchase_attachments for all to authenticated
  using (public.owns_site(site_id))
  with check (public.owns_site(site_id));
