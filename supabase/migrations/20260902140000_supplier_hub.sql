-- Supplier hub: embed flag, owner CRUD RLS, pin delete

alter table public.products
  add column if not exists embedded_in_supplier boolean not null default false;

-- Tedarikçi profil sahibi kendi firmasının ürünlerini yönetebilsin
create policy "products_update_supplier_owner"
  on public.products for update to authenticated
  using (
    exists (
      select 1 from public.supplier_profiles sp
      where sp.id = products.supplier_profile_id
        and sp.user_id = (select auth.uid())
    )
  );

create policy "products_delete_supplier_owner"
  on public.products for delete to authenticated
  using (
    exists (
      select 1 from public.supplier_profiles sp
      where sp.id = products.supplier_profile_id
        and sp.user_id = (select auth.uid())
    )
  );

-- Pin silme (tedarikçi kendi pinlerini silebilsin)
create policy "supplier_locations_delete_own"
  on public.supplier_locations for delete to authenticated
  using (
    exists (
      select 1 from public.supplier_profiles sp
      where sp.id = supplier_profile_id and sp.user_id = (select auth.uid())
    ) or public.is_admin()
  );
