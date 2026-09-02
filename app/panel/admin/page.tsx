import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { ModerateButtons } from "@/components/panel/ModerateButtons";
import { ServiceRoleBanner } from "@/components/panel/ServiceRoleBanner";
import { RoleRequestButtons } from "@/components/panel/RoleRequestButtons";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

export default async function AdminPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/panel");

  const [
    { data: pendingProducts },
    { data: pendingProfiles },
    { data: pendingLocations },
    { data: pendingProductLocs },
    { data: roleReqs },
  ] = await Promise.all([
    session.supabase
      .from("products")
      .select("id, name, status, created_at")
      .eq("status", "pending")
      .order("created_at"),
    session.supabase
      .from("supplier_profiles")
      .select("id, org_name, status, city")
      .eq("status", "pending"),
    session.supabase
      .from("supplier_locations")
      .select("id, label, lat, lng, status")
      .eq("status", "pending"),
    session.supabase
      .from("user_product_locations")
      .select("id, product_name, label, lat, lng, status")
      .eq("status", "pending"),
    session.supabase
      .from("role_requests")
      .select("id, user_id, note, status, created_at")
      .eq("status", "pending"),
  ]);

  const queues = [
    {
      title: "Bekleyen ürünler",
      count: (pendingProducts ?? []).length,
      empty: "Bekleyen ürün yok.",
      items: (pendingProducts ?? []).map((p) => ({
        id: p.id,
        title: p.name,
        meta: p.status,
        table: "products" as const,
      })),
    },
    {
      title: "Bekleyen tedarikçi profilleri",
      count: (pendingProfiles ?? []).length,
      empty: "Bekleyen profil yok. Onaylandığında bağlı pin ve ürünler otomatik yayınlanır.",
      items: (pendingProfiles ?? []).map((p) => ({
        id: p.id,
        title: p.org_name,
        meta: p.city ?? "",
        table: "supplier_profiles" as const,
      })),
    },
    {
      title: "Bekleyen tedarikçi harita pinleri",
      count: (pendingLocations ?? []).length,
      empty: "Bekleyen pin yok. (Profil onaylı tedarikçilerde pinler otomatik yayınlanır.)",
      items: (pendingLocations ?? []).map((p) => ({
        id: p.id,
        title: p.label || "Pin",
        meta: `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
        table: "supplier_locations" as const,
      })),
    },
    {
      title: "Bekleyen ürün konumları",
      count: (pendingProductLocs ?? []).length,
      empty: "Bekleyen ürün konumu yok.",
      items: (pendingProductLocs ?? []).map((p) => ({
        id: p.id,
        title: p.product_name,
        meta: `${p.label || "Konum"} · ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
        table: "user_product_locations" as const,
      })),
    },
  ];

  const totalPending =
    queues.reduce((s, q) => s + q.count, 0) + (roleReqs ?? []).length;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="FiX Ai · Admin"
        title="Moderasyon paneli"
        description="Onay kuyruğu, roller, kategoriler, KVKK moderasyonu (R2–R4)."
        actions={
          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-2 text-sm">
            <span className="text-slate-500">Bekleyen toplam</span>
            <p className="font-semibold text-brand-900">{totalPending}</p>
          </div>
        }
      />

      <ServiceRoleBanner />

      {queues.map((queue) => (
        <section key={queue.title} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-brand-900">{queue.title}</h3>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {queue.count}
            </span>
          </div>
          <Queue empty={queue.empty} items={queue.items} />
        </section>
      ))}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-brand-900">Rol başvuruları</h3>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {(roleReqs ?? []).length}
          </span>
        </div>
        <ul className={listPanelClass}>
          {(roleReqs ?? []).length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">Başvuru yok.</li>
          ) : (
            (roleReqs ?? []).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{r.user_id}</p>
                  <p className="text-slate-500">{r.note || "Tedarikçi rolü"}</p>
                </div>
                <RoleRequestButtons requestId={r.id} />
              </li>
            ))
          )}
        </ul>
      </section>

      <SectionCard
        title="Kategori yönetimi"
        description="Segment ve alt segmentleri ekleyin, düzenleyin veya sıralayın."
      >
        <Link
          href="/panel/kategoriler"
          className="inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Kategoriler sayfasına git
        </Link>
      </SectionCard>
    </div>
  );
}

function Queue({
  items,
  empty,
}: {
  empty: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    table:
      | "products"
      | "supplier_profiles"
      | "supplier_locations"
      | "user_product_locations";
  }>;
}) {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 px-4 py-6 text-sm text-slate-500">{empty}</p>;
  }
  return (
    <ul className={listPanelClass}>
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium text-brand-900">{item.title}</p>
            <p className="text-slate-500">{item.meta}</p>
          </div>
          <ModerateButtons table={item.table} id={item.id} />
        </li>
      ))}
    </ul>
  );
}
