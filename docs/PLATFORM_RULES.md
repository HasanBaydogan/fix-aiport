# FiX Ai Platform Rules

Her yeni özellik / senaryoda bu kurallar uygulanır. PR veya plan notunda: Senaryo · Katman · Rol · RLS · KVKK.

## R1 Görünürlük
- `public_anon`: fiyat/yorum yok
- `public_auth`: yalnızca authenticated SELECT
- `private`: owner veya admin

## R2 Roller
- `buyer` | `supplier` | `admin`
- Yetki yalnızca `app_metadata.role` (asla `user_metadata`)
- Varsayılan kayıt: buyer; supplier Admin onayı ile

## R3 Moderasyon
- Global içerik: `draft | pending | published | rejected | archived`
- Anon/auth yalnızca `published`

## R4 KVKK
- Public tedarikçi whitelist: unvan, şehir/ilçe, iş pin, kategori, iş telefonu/web
- `kvkk_consent_at` yoksa haritada görünmez

## R5 Form kit
- Ortak FormShell / alanlar / FileDropzone
- Submit hedefi config: SubmitKit veya Supabase

## R6 Harita
- Leaflet only; anon yalnızca `published` pinler
- Global harita (`/harita`): `supplier_locations` (published + KVKK onaylı profil) + `user_product_locations` (published)
- Ürün konumu public_anon: `product_name`, `label`, `lat`, `lng`; `notes` yalnızca owner/admin
- Otomatik tedarikçi bağlama: tedarikçi rolü kendi profiline; alıcı yalnızca mevcut yayınlı tedarikçi adı eşleşmesi (KVKK — yeni profil oluşturulmaz)
- Ürün `published` olunca bağlı `user_product_locations` kayıtları otomatik `published`

## R7 Şantiye
- Stok / satın alma / liste / ilerleme günlüğü (foto + tarih) `site_id` + ownership
- Soft-delete (archive); hard delete admin

## R8 Değerlendirme
- Kullanıcı başına ürün/hizmet için tek aktif kayıt
- MVP’de satın alma doğrulaması yok (ileride sıkılaşır)

## R9 Güvenlik
- RLS açık; service_role yalnız server
- Auth için getUser/getClaims

## R10 UX
- CRUD ≤3 adım; progressive disclosure
