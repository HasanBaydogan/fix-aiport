import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceReview } from "@/lib/actions";
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
import { buttonSecondaryClass, cardClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "opacity-100" : "opacity-30"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default async function TedarikciPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasSupabaseEnv()) notFound();
  const { id } = await params;
  const session = await getSessionUser();
  const supabase = session?.supabase ?? (await createClient());

  const { data: profile } = await supabase
    .from("supplier_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (
    !profile ||
    (profile.status !== "published" &&
      profile.user_id !== session?.user.id &&
      session?.role !== "admin")
  ) {
    notFound();
  }

  const { data: locations } = await supabase
    .from("supplier_locations")
    .select("id, lat, lng, label, status")
    .eq("supplier_profile_id", id)
    .eq("status", "published");

  const { data: firmProducts } = await supabase
    .from("products")
    .select("id, name, weight_kg, sourced_from_text, embedded_in_supplier, categories(name)")
    .eq("supplier_profile_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(48);

  const mapPins: GlobalMapPin[] = (locations ?? []).map((loc) => ({
    id: loc.id,
    lat: loc.lat,
    lng: loc.lng,
    kind: "supplier" as const,
    title: profile.org_name,
    subtitle: loc.label,
    linkHref: `/tedarikci/${id}`,
  }));

  let reviews: Array<{ rating: number; body: string | null }> = [];
  if (session) {
    const { data } = await supabase
      .from("service_reviews")
      .select("rating, body")
      .eq("supplier_profile_id", id)
      .eq("status", "published");
    reviews = data ?? [];
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const initial = profile.org_name.charAt(0).toUpperCase();

  return (
    <PageShell userEmail={session?.user.email} role={session?.role} width="3xl" className="space-y-6">
      <Link href="/harita" className="text-sm text-brand-600 hover:underline">
        ← Harita
      </Link>

      <div className={cardClass}>
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-brand-900">{profile.org_name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {[profile.district, profile.city].filter(Boolean).join(", ") || "Konum belirtilmemiş"}
            </p>
            {profile.category_focus ? (
              <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-0.5 text-xs text-brand-700">
                {profile.category_focus}
              </span>
            ) : null}
            {avgRating != null ? (
              <div className="mt-2">
                <StarRating rating={avgRating} />
                <span className="ml-2 text-xs text-slate-500">
                  {avgRating.toFixed(1)} · {reviews.length} değerlendirme
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.public_phone ? (
            <a href={`tel:${profile.public_phone}`} className={buttonSecondaryClass}>
              {profile.public_phone}
            </a>
          ) : null}
          {profile.website ? (
            <a
              href={profile.website}
              className={buttonSecondaryClass}
              target="_blank"
              rel="noreferrer"
            >
              Web sitesi
            </a>
          ) : null}
          <Link href={`/urunler?supplier=${id}`} className={buttonSecondaryClass}>
            Bu tedarikçinin ürünleri
          </Link>
        </div>
      </div>

      {mapPins.length > 0 ? (
        <div className={cardClass}>
          <h2 className="font-semibold text-brand-900">Konumlar</h2>
          <div className="mt-4">
            <GlobalMap pins={mapPins} isLoggedIn={Boolean(session)} />
          </div>
        </div>
      ) : null}

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-brand-900">Firma ürünleri</h2>
          <Link
            href={`/urunler?supplier=${id}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Tümünü gör →
          </Link>
        </div>
        {(firmProducts ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Henüz yayınlanmış ürün yok.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(firmProducts ?? []).map((p) => {
              const cat = p.categories as
                | { name: string }
                | { name: string }[]
                | null;
              const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
              return (
                <Link
                  key={p.id}
                  href={`/urunler/${p.id}`}
                  className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3 transition hover:border-brand-200 hover:bg-brand-50"
                >
                  <p className="font-medium text-brand-900">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {catName ?? "Segment yok"}
                    {p.weight_kg != null ? ` · ${p.weight_kg} kg` : ""}
                    {p.embedded_in_supplier ? " · gömülü" : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="font-semibold text-brand-900">Hizmet değerlendirmeleri</h2>
        {!session ? (
          <div className="mt-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 px-4 py-6 text-center">
            <p className="text-sm text-slate-600">
              Görmek / yazmak için{" "}
              <Link href="/giris" className="font-semibold text-brand-600 underline">
                giriş yapın
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-3 space-y-2 text-sm">
              {reviews.length === 0 ? (
                <li className="text-slate-500">Henüz değerlendirme yok.</li>
              ) : (
                reviews.map((r, i) => (
                  <li key={i} className="rounded-xl bg-brand-50/60 px-3 py-3">
                    <StarRating rating={r.rating} />
                    {r.body ? <p className="mt-2">{r.body}</p> : null}
                  </li>
                ))
              )}
            </ul>
            <div className="mt-6 border-t border-brand-100 pt-4">
              <ActionForm action={createServiceReview} submitLabel="Değerlendir">
                <input type="hidden" name="supplier_profile_id" value={id} />
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
