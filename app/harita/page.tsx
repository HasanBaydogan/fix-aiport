import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { GlobalMap } from "@/components/map/GlobalMap";
import type { GlobalMapPin } from "@/components/map/GlobalMapInner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSessionUser } from "@/lib/auth/roles";
import {
  getCategoryPathLabel,
  getMainCategories,
  matchesCategoryFilter,
  pinColorForCategory,
  resolveMainCategory,
  type CategoryRow,
} from "@/lib/categories";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Malzeme & Tedarik Haritası" };
export const dynamic = "force-dynamic";

export default async function HaritaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const session = await getSessionUser();
  let pins: GlobalMapPin[] = [];
  let categories: CategoryRow[] = [];

  if (hasSupabaseEnv()) {
    const client = session?.supabase ?? (await createClient());

    const [{ data: supplierLocs }, { data: productLocs }, { data: categoryRows }] =
      await Promise.all([
        client
          .from("supplier_locations")
          .select(
            "id, lat, lng, label, supplier_profile_id, supplier_profiles(org_name, city, status, kvkk_consent_at)",
          )
          .eq("status", "published"),
        client
          .from("user_product_locations")
          .select(
            "id, lat, lng, label, product_name, product_id, products(category_id, embedded_in_supplier, categories(id, name, parent_id))",
          )
          .eq("status", "published"),
        client.from("categories").select("id, name, slug, parent_id, sort_order").order("sort_order"),
      ]);

    categories = (categoryRows ?? []) as CategoryRow[];

    for (const loc of supplierLocs ?? []) {
      const sp = loc.supplier_profiles as unknown as {
        org_name: string;
        city: string | null;
        status: string;
        kvkk_consent_at: string | null;
      } | null;
      if (!sp || sp.status !== "published" || !sp.kvkk_consent_at) continue;
      pins.push({
        id: loc.id,
        lat: loc.lat,
        lng: loc.lng,
        kind: "supplier",
        title: sp.org_name,
        subtitle: loc.label || sp.city,
        linkHref: `/tedarikci/${loc.supplier_profile_id}`,
      });
    }

    for (const loc of productLocs ?? []) {
      const productRaw = loc.products as unknown;
      const product = (Array.isArray(productRaw) ? productRaw[0] : productRaw) as {
        category_id: string | null;
        embedded_in_supplier?: boolean | null;
        categories:
          | { id: string; name: string; parent_id: string | null }
          | { id: string; name: string; parent_id: string | null }[]
          | null;
      } | null;

      // Gömülü ürünler haritada ürün pini olarak görünmez
      if (product?.embedded_in_supplier) continue;

      const catRel = product?.categories;
      const catObj = Array.isArray(catRel) ? catRel[0] : catRel;
      const categoryId = product?.category_id ?? catObj?.id ?? null;

      if (!matchesCategoryFilter(categoryId, params.category, categories)) continue;

      const categoryLabel =
        categoryId != null ? getCategoryPathLabel(categoryId, categories) : null;

      pins.push({
        id: loc.id,
        lat: loc.lat,
        lng: loc.lng,
        kind: "product",
        title: loc.product_name,
        subtitle: loc.label,
        linkHref: loc.product_id ? `/urunler/${loc.product_id}` : "/urunler",
        pinColor: pinColorForCategory(categoryId, categories),
        categoryLabel,
      });
    }

    pins.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "supplier" ? -1 : 1;
      return (a.categoryLabel ?? a.title).localeCompare(b.categoryLabel ?? b.title, "tr");
    });
  }

  const mainCategories = getMainCategories(categories);
  const supplierCount = pins.filter((p) => p.kind === "supplier").length;
  const productCount = pins.filter((p) => p.kind === "product").length;
  const activeMain = params.category
    ? resolveMainCategory(params.category, categories)
    : null;

  return (
    <PageShell userEmail={session?.user.email} role={session?.role} className="space-y-6">
      <PageHeader
        eyebrow="FiX Ai · Harita"
        title="Malzeme & tedarik haritası"
        description="Tedarikçi pinleri ve ürün konumları. Ürün pin rengi ana kategoriye göre değişir."
        actions={
          pins.length > 0 ? (
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-2 text-sm">
              <span className="font-semibold text-brand-900">{supplierCount}</span> tedarikçi
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-semibold text-brand-900">{productCount}</span> ürün konumu
            </div>
          ) : null
        }
      />

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Kategori filtresi
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/harita"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              !params.category
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-brand-200 text-brand-900 hover:bg-brand-50"
            }`}
          >
            Tümü
          </Link>
          {mainCategories.map((main) => {
            const color = pinColorForCategory(main.id, categories);
            const active = params.category === main.id || activeMain?.id === main.id;
            return (
              <Link
                key={main.id}
                href={`/harita?category=${main.id}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-brand-200 text-brand-900 hover:bg-brand-50"
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/80"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {main.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1">
          <span className="inline-block h-4 w-3 rounded-sm bg-brand-600" aria-hidden />
          Tedarikçi
        </span>
        {mainCategories.map((main) => (
          <span
            key={main.id}
            className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1"
          >
            <span
              className="inline-block h-3 w-3 rounded-full ring-2 ring-white"
              style={{
                backgroundColor: pinColorForCategory(main.id, categories),
              }}
              aria-hidden
            />
            {main.name}
          </span>
        ))}
      </div>

      {pins.length > 0 ? (
        <GlobalMap pins={pins} isLoggedIn={Boolean(session)} />
      ) : (
        <EmptyState
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title={params.category ? "Bu kategoride pin yok" : "Henüz yayınlanmış pin yok"}
          description="Ürün eklerken konum işaretleyin veya tedarikçi profilinize pin ekleyin."
          primaryHref={session ? "/panel/urun-ekle" : "/giris"}
          primaryLabel={session ? "Ürün ekle" : "Giriş yap"}
        />
      )}
    </PageShell>
  );
}
