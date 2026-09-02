import Link from "next/link";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { buttonCompactClass, listPanelClass } from "@/lib/ui/classes";

export default async function TedarikciDashboardPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/tedarikci");

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const [{ count: productCount }, { count: pinCount }, { count: publishedPinCount }] =
    await Promise.all([
      profile
        ? session.supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("supplier_profile_id", profile.id)
        : Promise.resolve({ count: 0 }),
      profile
        ? session.supabase
            .from("supplier_locations")
            .select("*", { count: "exact", head: true })
            .eq("supplier_profile_id", profile.id)
        : Promise.resolve({ count: 0 }),
      profile
        ? session.supabase
            .from("supplier_locations")
            .select("*", { count: "exact", head: true })
            .eq("supplier_profile_id", profile.id)
            .eq("status", "published")
        : Promise.resolve({ count: 0 }),
    ]);

  const checklist = [
    {
      done: Boolean(profile?.org_name && profile.kvkk_consent_at),
      label: "Profili tamamla ve KVKK onayını ver",
      href: "/panel/tedarikci/profil",
    },
    {
      done: profile?.status === "published",
      label:
        profile?.status === "published"
          ? "Profil onaylandı"
          : "Admin profil onayını bekle",
      href: "/panel/tedarikci/profil",
    },
    {
      done: (pinCount ?? 0) > 0,
      label: "Harita pini ekle",
      href: "/panel/tedarikci/pinler",
    },
    {
      done: (productCount ?? 0) > 0,
      label: "İlk ürünü ekle",
      href: "/panel/tedarikci/urunler",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Tedarikçi"
        title="Tedarikçi paneli"
        description="Firma profilinizi, ürünlerinizi ve harita pinlerinizi buradan yönetin."
        actions={
          profile?.status === "published" ? (
            <Link
              href={`/tedarikci/${profile.id}`}
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Public profili gör
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Profil durumu</p>
          <div className="mt-1 flex items-center gap-2">
            {profile ? <Badge status={profile.status} /> : <span className="text-sm text-slate-500">Yok</span>}
          </div>
        </div>
        <Link
          href="/panel/tedarikci/urunler"
          className="rounded-2xl border border-brand-100 bg-white px-4 py-3 hover:bg-brand-50/50"
        >
          <p className="text-xs text-slate-500">Firma ürünleri</p>
          <p className="mt-1 text-2xl font-semibold text-brand-900">{productCount ?? 0}</p>
        </Link>
        <Link
          href="/panel/tedarikci/pinler"
          className="rounded-2xl border border-brand-100 bg-white px-4 py-3 hover:bg-brand-50/50"
        >
          <p className="text-xs text-slate-500">Harita pinleri</p>
          <p className="mt-1 text-2xl font-semibold text-brand-900">
            {publishedPinCount ?? 0}
            <span className="ml-1 text-sm font-normal text-slate-500">
              / {pinCount ?? 0}
            </span>
          </p>
        </Link>
      </div>

      <SectionCard title="Kurulum adımları" description="Haritada görünmek için sırayı tamamlayın.">
        <ul className={listPanelClass}>
          {checklist.map((item) => (
            <li
              key={item.label}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    item.done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-brand-100 text-brand-700"
                  }`}
                >
                  {item.done ? "✓" : "•"}
                </span>
                <span className={item.done ? "text-slate-500 line-through" : "text-brand-900"}>
                  {item.label}
                </span>
              </div>
              {!item.done ? (
                <Link href={item.href} className={buttonCompactClass}>
                  Git
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/panel/tedarikci/profil"
          className="rounded-2xl border border-brand-100 bg-white px-4 py-3 hover:border-brand-200"
        >
          <p className="font-medium text-brand-900">Profil</p>
          <p className="text-xs text-slate-500">Unvan, KVKK, iletişim</p>
        </Link>
        <Link
          href="/panel/tedarikci/urunler"
          className="rounded-2xl border border-brand-100 bg-white px-4 py-3 hover:border-brand-200"
        >
          <p className="font-medium text-brand-900">Ürünler</p>
          <p className="text-xs text-slate-500">Firma kataloğu</p>
        </Link>
        <Link
          href="/panel/tedarikci/pinler"
          className="rounded-2xl border border-brand-100 bg-white px-4 py-3 hover:border-brand-200"
        >
          <p className="font-medium text-brand-900">Harita pinleri</p>
          <p className="text-xs text-slate-500">Depo / şube konumları</p>
        </Link>
      </div>
    </div>
  );
}
