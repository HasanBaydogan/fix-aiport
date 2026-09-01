# FiX Ai Platform

Şantiye, stok, satın alma, ürün kataloğu ve Leaflet tedarikçi haritası. Tamirat talep formu login olmadan kullanılabilir (SubmitKit).

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- Supabase (Auth, Postgres RLS, Storage)
- Leaflet / react-leaflet
- SubmitKit (yalnızca `/tamirat`)

## Kurulum

1. Supabase projesi oluşturun.
2. [`supabase/migrations/20260831100000_init_platform.sql`](supabase/migrations/20260831100000_init_platform.sql) dosyasını SQL Editor’de çalıştırın.
3. `.env.local` oluşturun (`.env.example` dosyasındaki açıklamalara bakın):

```env
NEXT_PUBLIC_SUBMITKIT_FORM_ID=your_form_id_or_full_url
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Service role anahtarı:** Supabase Dashboard → **Project Settings** → **API** → `service_role` (secret). Bu anahtar yalnızca sunucuda kullanılır; tedarikçi rol başvurusu onayı (`/panel/admin`) için zorunludur. Boş bırakılırsa admin panelinde uyarı görünür ve rol onayı çalışmaz.

4. Migration dosyalarını sırayla SQL Editor'de çalıştırın (`supabase/migrations/`).

5. İlk admin: Auth’ta bir kullanıcı oluşturun, ardından Dashboard → Authentication → user → `app_metadata` içine `{"role":"admin"}` yazın ve `profiles.role` alanını `admin` yapın. Oturumu yenileyin.

```bash
npm install
npm run dev
```

## Görünürlük kuralları (özet)

| Katman | Kim | Örnek |
|--------|-----|--------|
| public_anon | Herkes | Ürün temel alanları, harita pinleri, tamirat formu |
| public_auth | Login | Fiyatlar, ürün/hizmet değerlendirmeleri |
| private | Sahip + Admin | Şantiye, stok, satın alma, satın alınacaklar |

Roller: `buyer` | `supplier` | `admin` — yalnızca `app_metadata` (R2).

## Rotalar

- `/` landing · `/tamirat` · `/urunler` · `/harita`
- `/giris` · `/kayit` · `/sifremi-unuttum`
- `/panel/*` (auth) · `/panel/admin` (admin)

## Deploy

Vercel’e bağlayın; yukarıdaki env değişkenlerini Production/Preview’a ekleyin.
