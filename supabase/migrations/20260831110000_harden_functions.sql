-- Harden helper functions: fixed search_path + revoke public EXECUTE on definer funcs
create or replace function public.jwt_role()
returns text
language sql
stable
set search_path = public
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
set search_path = public
as $$
  select public.jwt_role() = 'admin';
$$;

create or replace function public.is_supplier_or_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.jwt_role() in ('supplier', 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  return new;
end;
$$;

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

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.owns_site(uuid) from public, anon;
grant execute on function public.owns_site(uuid) to authenticated;
revoke all on function public.jwt_role() from public, anon;
grant execute on function public.jwt_role() to authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.is_supplier_or_admin() from public, anon;
grant execute on function public.is_supplier_or_admin() to authenticated;
