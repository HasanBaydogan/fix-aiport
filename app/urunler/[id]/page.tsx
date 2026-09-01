import Link from "next/link";
import { notFound } from "next/navigation";
import { createProductReview } from "@/lib/actions";
import { PageShell } from "@/components/layout/PageShell";
import { GlobalMap } from "@/components/map/GlobalMap";
import type { GlobalMapPin } from "@/components/map/GlobalMapInner";
import { getSessionUser } from "@/lib/auth/roles";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  ActionForm,
  TextArea,
  TextInput,
} from "@/components/forms/ActionForm";
import { cardClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "opacity-100" : "opacity-30"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!hasSupabaseEnv()) notFound();

  const session = await getSessionUser();
  const supabase = session?.supabase ?? (await createClient());

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name), supplier_profiles(id, org_name, status)")
    .eq("id", id)
    .maybeSingle();

  if (!product || (product.status !== "published" && product.created_by !== session?.user.id && session?.role !== "admin")) {
    notFound();
  }

  const supplierProfile = product.supplier_profiles as {
    id: string;
    org_name: string;
    status: string;
  } | null;

  const { data: publishedLocations } = await supabase
    .from("user_product_locations")
    .select("id, lat, lng, label, product_name")
    .eq("product_id", id)
    .eq("status", "published");

  const locationPins: GlobalMapPin[] = (publishedLocations ?? []).map((loc) => ({
    id: loc.id,
    lat: loc.lat,
    lng: loc.lng,
    kind: "product" as const,
    title: loc.product_name,
    subtitle: loc.label,
    linkHref: `/urunler/${id}`,
  }));

  let prices: Array<{ amount: number; currency: string; observed_at: string }> = [];
  let reviews: Array<{ rating: number; body: string | null; created_at: string }> = [];

  if (session) {
    const [priceRes, reviewRes] = await Promise.all([
      supabase
        .from("product_prices")
        .select("amount, currency, observed_at")
        .eq("product_id", id)
        .order("observed_at", { ascending: false })
        .limit(5),
      supabase
        .from("product_reviews")
        .select("rating, body, created_at")
        .eq("product_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);
    prices = priceRes.data ?? [];
    reviews = reviewRes.data ?? [];
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const categoryName = Array.isArray(product.categories)
    ? product.categories[0]?.name
    : (product.categories as { name: string } | null)?.name;

  return (
    <PageShell userEmail={session?.user.email} role={session?.role} width="3xl" className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/urunler" className="text-brand-600 hover:underline">
          Ürünler
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-900">{product.name}</span>
      </nav>

      <div className={cardClass}>
        <div className="flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200">
          <span className="text-5xl font-bold text-brand-600/50">
            {product.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-brand-900">{product.name}</h1>
            {categoryName ? (
              <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-0.5 text-xs font-medium text-brand-700">
                {categoryName}
              </span>
            ) : null}
          </div>
          {avgRating != null ? (
            <div className="text-right">
              <StarRating rating={avgRating} />
              <p className="mt-1 text-xs text-slate-500">
                {avgRating.toFixed(1)} · {reviews.length} değerlendirme
              </p>
            </div>
          ) : null}
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-brand-50/50 px-4 py-3">
            <dt className="text-slate-500">Ağırlık</dt>
            <dd className="mt-1 font-semibold text-brand-900">{product.weight_kg ?? "—"} kg</dd>
          </div>
          <div className="rounded-xl bg-brand-50/50 px-4 py-3">
            <dt className="text-slate-500">Boyutlar</dt>
            <dd className="mt-1 font-semibold text-brand-900">
              {[product.length_cm, product.width_cm, product.height_cm]
                .filter((v) => v != null)
                .join(" × ") || "—"}{" "}
              {product.dimension_unit}
            </dd>
          </div>
          <div className="rounded-xl bg-brand-50/50 px-4 py-3 sm:col-span-2">
            <dt className="text-slate-500">Tedarik</dt>
            <dd className="mt-1 font-semibold text-brand-900">
              {product.sourced_from_text || "—"}
              {supplierProfile && supplierProfile.status === "published" ? (
                <Link
                  href={`/tedarikci/${supplierProfile.id}`}
                  className="mt-2 block text-sm font-normal text-brand-600 hover:underline"
                >
                  {supplierProfile.org_name} → tedarikçi profili
                </Link>
              ) : null}
            </dd>
          </div>
          {product.description ? (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Açıklama</dt>
              <dd className="mt-2 leading-6 text-slate-700">{product.description}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {locationPins.length > 0 ? (
        <div className={cardClass}>
          <h2 className="font-semibold text-brand-900">Tedarik konumları</h2>
          <p className="mt-1 text-sm text-slate-600">
            Onaylı ürün konumları global haritada da görünür.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {(publishedLocations ?? []).map((loc) => (
              <li key={loc.id}>
                {loc.label || "Konum"} · {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <GlobalMap pins={locationPins} isLoggedIn={Boolean(session)} />
          </div>
        </div>
      ) : null}

      <div className={cardClass}>
        <h2 className="font-semibold text-brand-900">Fiyatlar</h2>
        {!session ? (
          <div className="mt-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 px-4 py-6 text-center">
            <p className="text-sm text-slate-600">
              Fiyat geçmişini görmek için{" "}
              <Link href="/giris" className="font-semibold text-brand-600 underline">
                giriş yapın
              </Link>
              .
            </p>
          </div>
        ) : prices.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Henüz fiyat bildirimi yok.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {prices.map((p, i) => (
              <li key={i} className="flex justify-between rounded-xl bg-brand-50/50 px-3 py-2">
                <strong>
                  {p.amount} {p.currency}
                </strong>
                <span className="text-slate-500">
                  {new Date(p.observed_at).toLocaleDateString("tr-TR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="font-semibold text-brand-900">Değerlendirmeler</h2>
        {!session ? (
          <div className="mt-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 px-4 py-6 text-center">
            <p className="text-sm text-slate-600">
              Yorumları okumak ve yazmak için{" "}
              <Link href="/giris" className="font-semibold text-brand-600 underline">
                giriş yapın
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-3 space-y-3 text-sm">
              {reviews.length === 0 ? (
                <li className="text-slate-500">Henüz değerlendirme yok. İlk yorumu siz yazın.</li>
              ) : (
                reviews.map((r, i) => (
                  <li key={i} className="rounded-xl bg-brand-50/60 px-3 py-3">
                    <StarRating rating={r.rating} />
                    {r.body ? <p className="mt-2 text-slate-700">{r.body}</p> : null}
                  </li>
                ))
              )}
            </ul>
            <div className="mt-6 border-t border-brand-100 pt-4">
              <ActionForm action={createProductReview} submitLabel="Değerlendir">
                <input type="hidden" name="product_id" value={id} />
                <TextInput
                  name="rating"
                  label="Puan (1–5)"
                  type="number"
                  required
                  defaultValue="5"
                />
                <TextArea name="body" label="Yorum" />
              </ActionForm>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
