-- Arel (arel@aiport.tr) hesabını onayla ve admin yap
-- UID: 17a2d2f0-623f-4a1c-a634-46a167919726
-- Çalıştırma: Supabase Dashboard → SQL Editor, veya MCP execute_sql

begin;

-- 1) E-posta onayı + app_metadata.role = admin (JWT / RLS için kaynak)
update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'provider', coalesce(raw_app_meta_data ->> 'provider', 'email'),
      'providers', coalesce(raw_app_meta_data -> 'providers', '["email"]'::jsonb),
      'role', 'admin'
    )
where id = '17a2d2f0-623f-4a1c-a634-46a167919726'
  and email = 'arel@aiport.tr';

-- 2) profiles.role senkronu (uygulama tablosu)
update public.profiles
set role = 'admin'
where id = '17a2d2f0-623f-4a1c-a634-46a167919726';

commit;

-- Doğrulama
select
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_app_meta_data ->> 'role' as app_role,
  p.role as profile_role,
  p.display_name
from auth.users u
left join public.profiles p on p.id = u.id
where u.id = '17a2d2f0-623f-4a1c-a634-46a167919726';
