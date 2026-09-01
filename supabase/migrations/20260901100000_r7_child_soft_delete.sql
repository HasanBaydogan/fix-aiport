-- R7 soft-delete for child tables + purchase list fulfillment trace

alter table public.site_stock
  add column if not exists archived_at timestamptz;

alter table public.purchases
  add column if not exists archived_at timestamptz;

alter table public.purchase_list_items
  add column if not exists archived_at timestamptz,
  add column if not exists purchase_id uuid references public.purchases (id) on delete set null;

create index if not exists site_stock_active_idx
  on public.site_stock (site_id)
  where archived_at is null;

create index if not exists purchases_active_idx
  on public.purchases (site_id)
  where archived_at is null;

create index if not exists purchase_list_items_active_idx
  on public.purchase_list_items (site_id)
  where archived_at is null;
