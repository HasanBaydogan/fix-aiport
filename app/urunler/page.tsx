import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSessionUser } from "@/lib/auth/roles";
import {
  getMainCategories,
  getSubcategories,
  MAIN_CATEGORY_PIN_COLORS,
  matchesCategoryFilter,
  resolveMainCategory,
  type CategoryRow,
} from "@/lib/categories";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { cardClass, inputClass } from "@/lib/ui/classes";

export const metadata: Metadata = { title: "Ürünler" };
export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  name: string;
  weight_kg: number | null;
  sourced_from_text: string | null;
  category_id: string | null;
  categories: { name: string; parent_id: string | null } | null;
};

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; supplier?: string; q?: string }>;
}) {
  const params = await searchParams;
  const session = await getSessionUser();

  let products: ProductRow[] = [];
  let categories: CategoryRow[] = [];

  if (hasSupabaseEnv()) {
    const supabase = session?.supabase ?? (await createClient());

    let query = supabase
      .from("products")
      .select("id, name, weight_kg, sourced_from_text, status, category_id, categories(name, parent_id)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(120);

    if (params.supplier) query = query.eq("supplier_profile_id", params.supplier);
    if (params.q) query = query.ilike("name", `%${params.q}%`);

    const [productRes, categoryRes] = await Promise.all([
      query,
      supabase.from("categories").select("id, name, slug, parent_id, sort_order").order("sort_order"),
    ]);
    products = (productRes.data ?? []).map((row) => {
      const cats = row.categories as
        | { name: string; parent_id: string | null }
        | { name: string; parent_id: string | null }[]
        | null;
      return {
        ...row,
        categories: Array.isArray(cats) ? cats[0] ?? null : cats,
      };
    }) as ProductRow[];
    categories = (categoryRes.data ?? []) as CategoryRow[];

    if (params.category) {
      products = products.filter((p) =>
        matchesCategoryFilter(p.category_id, params.category, categories),
      );
    }
  }

  const mainCategories = getMainCategories(categories);
  const activeMain = params.category
    ? resolveMainCategory(params.category, categories)
    : null;
  const filterMainId = activeMain?.id;
  const sections = params.q
    ? null
    : mainCategories.filter((main) => {
        if (!params.category) return true;
        if (params.category === main.id) return true;
        return filterMainId === main.id;
      });

  function buildCategoryHref(id: string) {
    const sp = new URLSearchParams();
    sp.set("category", id);
    if (params.q) sp.set("q", params.q);
    if (params.supplier) sp.set("supplier", params.supplier);
    return `/urunler?${sp.toString()}`;
  }

  function productsForMain(mainId: string) {
    return products.filter((p) => {
      const main = resolveMainCategory(p.category_id, categories);
      return main?.id === mainId;
    });
  }

  return (
    <PageShell userEmail={session?.user.email} role={session?.role} className="space-y-6">
      <PageHeader
        eyebrow="FiX Ai · Katalog"
        title="Ürünler"
        description="Ana kategori ve alt segmentlere göre malzeme kataloğu."
        actions={
          <form className="flex gap-2">
            <input type="hidden" name="category" value={params.category ?? ""} />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Ürün ara…"
              className={`${inputClass(false)} !w-48 !py-2 sm:!w-56`}
            />
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ara
            </button>
          </form>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/urunler"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            !params.category
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-brand-200 text-brand-900 hover:bg-brand-50"
          }`}
        >
          Tümü
        </Link>
        {mainCategories.map((main) => {
          const color = MAIN_CATEGORY_PIN_COLORS[main.slug] ?? "#64748b";
          const active = params.category === main.id || activeMain?.id === main.id;
          return (
            <Link
              key={main.id}
              href={buildCategoryHref(main.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-brand-200 text-brand-900 hover:bg-brand-50"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              {main.name}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Ürün bulunamadı"
          description="Farklı bir kategori seçin veya yeni ürün ekleyin."
          primaryHref={session ? "/panel/urun-ekle" : "/giris"}
          primaryLabel={session ? "Ürün ekle" : "Giriş yap"}
        />
      ) : params.q || (params.category && !sections?.length) ? (
        <ProductGrid products={products} categories={categories} />
      ) : (
        <div className="space-y-10">
          {(sections ?? mainCategories).map((main) => {
            const sectionProducts = productsForMain(main.id);
            if (sectionProducts.length === 0) return null;
            const subs = getSubcategories(categories, main.id);
            const color = MAIN_CATEGORY_PIN_COLORS[main.slug] ?? "#64748b";

            return (
              <section key={main.id} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <h2 className="text-lg font-semibold text-brand-900">{main.name}</h2>
                </div>

                {subs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildCategoryHref(main.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        params.category === main.id
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-brand-200 hover:bg-brand-50"
                      }`}
                    >
                      Tümü
                    </Link>
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        href={buildCategoryHref(sub.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          params.category === sub.id
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-brand-200 hover:bg-brand-50"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ) : null}

                <ProductGrid
                  products={
                    params.category && activeMain?.id === main.id
                      ? sectionProducts.filter((p) =>
                          matchesCategoryFilter(p.category_id, params.category, categories),
                        )
                      : sectionProducts
                  }
                  categories={categories}
                />
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function ProductGrid({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: CategoryRow[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const cat = p.categories;
        const main = resolveMainCategory(p.category_id, categories);
        const subName = cat?.parent_id ? cat.name : null;
        const color = main ? MAIN_CATEGORY_PIN_COLORS[main.slug] : undefined;

        return (
          <Link
            key={p.id}
            href={`/urunler/${p.id}`}
            className={`${cardClass} group block transition hover:border-brand-300`}
          >
            <div
              className="flex h-24 items-center justify-center rounded-2xl"
              style={{
                background: color
                  ? `linear-gradient(135deg, ${color}22, ${color}44)`
                  : undefined,
              }}
            >
              <span
                className="text-3xl font-bold opacity-60"
                style={{ color: color ?? "#1557b8" }}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-2">
              <h3 className="font-semibold text-brand-900">{p.name}</h3>
              {subName || main ? (
                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                  {subName ?? main?.name}
                </span>
              ) : null}
            </div>
            {main && subName ? (
              <p className="mt-1 text-xs text-slate-500">
                {main.name} › {subName}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-slate-600">
              {p.weight_kg != null ? `${p.weight_kg} kg` : "Ağırlık —"}
              {p.sourced_from_text ? ` · ${p.sourced_from_text}` : ""}
            </p>
            <p className="mt-3 text-sm font-semibold text-brand-600 group-hover:underline">
              Detay →
            </p>
          </Link>
        );
      })}
    </div>
  );
}
