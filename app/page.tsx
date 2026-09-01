import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { getSessionUser } from "@/lib/auth/roles";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  heroGradientClass,
  iconBoxClass,
} from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSessionUser();

  let productCount = 0;
  let supplierPinCount = 0;
  let categoryCount = 0;

  if (hasSupabaseEnv()) {
    const supabase = session?.supabase ?? (await createClient());
    const [products, locations, categories] = await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("supplier_locations")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("categories").select("*", { count: "exact", head: true }),
    ]);
    productCount = products.count ?? 0;
    supplierPinCount = locations.count ?? 0;
    categoryCount = categories.count ?? 0;
  }

  const features = [
    {
      title: "Global ürünler",
      body: "İnşaat, yapı, tamirat ve mimari segmentlerde malzeme kataloğu.",
      href: "/urunler",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      title: "Malzeme haritası",
      body: "Tedarikçi pinleri ve onaylı ürün konumlarını tek haritada keşfedin.",
      href: "/harita",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      title: "Şantiye paneli",
      body: "Stok, satın alımlar ve satın alınacaklar — yalnızca size özel.",
      href: session ? "/panel" : "/giris",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  const steps = [
    { n: "1", title: "Keşfet", body: "Ürün kataloğunda malzeme ve segmentlere göz atın." },
    { n: "2", title: "Haritada bul", body: "Tedarikçi ve ürün konumlarını haritada görün." },
    { n: "3", title: "Şantiye yönet", body: "Stok ve satın alımları şantiye bazında takip edin." },
    { n: "4", title: "Tamirat talebi", body: "Giriş yapmadan tamirat formu gönderin." },
  ];

  return (
    <PageShell userEmail={session?.user.email} role={session?.role} className="space-y-12">
      <section className={`${heroGradientClass} text-center`}>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          FiX Ai · Platform
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl lg:text-5xl">
          Şantiye, malzeme ve tedarik tek yerde
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Ürünleri keşfedin, tedarikçileri haritada görün, şantiyenizin stok ve satın alma
          süreçlerini kolay yönetin. Tamirat talebi için giriş gerekmez.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/urunler" className={`${buttonPrimaryClass} w-auto px-6`}>
            Ürünlere göz at
          </Link>
          <Link href="/harita" className={buttonSecondaryClass}>
            Tedarik haritası
          </Link>
          <Link href="/tamirat" className={buttonSecondaryClass}>
            Tamirat talebi
          </Link>
        </div>
      </section>

      {hasSupabaseEnv() ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Yayınlı ürün", value: productCount },
            { label: "Tedarikçi pini", value: supplierPinCount },
            { label: "Segment", value: categoryCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-brand-100 bg-white/80 px-5 py-4 text-center"
            >
              <p className="text-2xl font-semibold text-brand-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${cardClass} group block transition hover:border-brand-300 hover:shadow-lg`}
          >
            <div className={iconBoxClass}>{item.icon}</div>
            <h2 className="mt-4 text-lg font-semibold text-brand-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            <p className="mt-3 text-sm font-semibold text-brand-600 group-hover:underline">
              Devam et →
            </p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-center text-xl font-semibold text-brand-900">Nasıl çalışır?</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
          Dört adımda platformu kullanmaya başlayın.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-brand-100 bg-white/70 p-5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {step.n}
              </span>
              <h3 className="mt-3 font-semibold text-brand-900">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-10 text-center text-white sm:px-10">
        <h2 className="text-xl font-semibold sm:text-2xl">Hemen başlayın</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-brand-100 sm:text-base">
          Ücretsiz kayıt olun; şantiyelerinizi yönetin ve global kataloğa katkı verin.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={session ? "/panel" : "/kayit"}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            {session ? "Panele git" : "Kayıt ol"}
          </Link>
          {!session ? (
            <Link
              href="/giris"
              className="rounded-2xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Giriş yap
            </Link>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
