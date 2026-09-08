-- Tedarikçi rolü yalnızca admin panelden atanır; buyer self-request kapatılır (R2).
drop policy if exists "role_requests_insert_own" on public.role_requests;

-- supplier_profiles insert yalnızca admin.
drop policy if exists "supplier_profiles_insert_own" on public.supplier_profiles;
create policy "supplier_profiles_insert_admin"
  on public.supplier_profiles for insert to authenticated
  with check (public.is_admin());
