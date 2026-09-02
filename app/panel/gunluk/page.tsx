import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { DailyLogSection } from "@/components/panel/DailyLogSection";
import { SiteFilterBadge } from "@/components/panel/SiteFilterBadge";
import { WarehouseFilterBadge } from "@/components/panel/WarehouseFilterBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  fetchDailyLogEntries,
  fetchSiteAndWarehouseOptions,
} from "@/lib/daily-log";

export default async function GunlukPage({
  searchParams,
}: {
  searchParams: Promise<{ site_id?: string; warehouse_id?: string }>;
}) {
  const { site_id: siteId, warehouse_id: warehouseId } = await searchParams;
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/gunluk");

  const [{ sites, warehouses }, entries] = await Promise.all([
    fetchSiteAndWarehouseOptions(session.supabase),
    fetchDailyLogEntries(session.supabase, {
      siteId,
      warehouseId,
    }),
  ]);

  const filteredSite = siteId ? sites.find((s) => s.id === siteId) : null;
  const filteredWarehouse = warehouseId
    ? warehouses.find((w) => w.id === warehouseId)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Günlük"
        title="Günlük raporu"
        description="Yapılan işleri not alın, şantiye veya depo etiketleyin, fotoğraf ekleyin."
      />

      {filteredSite ? (
        <SiteFilterBadge
          siteName={filteredSite.name}
          clearHref={
            warehouseId
              ? `/panel/gunluk?warehouse_id=${warehouseId}`
              : "/panel/gunluk"
          }
        />
      ) : null}
      {filteredWarehouse ? (
        <WarehouseFilterBadge
          warehouseName={filteredWarehouse.name}
          clearHref={siteId ? `/panel/gunluk?site_id=${siteId}` : "/panel/gunluk"}
        />
      ) : null}

      {(filteredSite || filteredWarehouse) && siteId && warehouseId ? (
        <p className="text-sm text-slate-500">
          <Link href="/panel/gunluk" className="text-brand-600 hover:underline">
            Tüm filtreleri kaldır
          </Link>
        </p>
      ) : null}

      <DailyLogSection
        title="Hızlı not ekle"
        description="Tarih varsayılan olarak bugün. Şantiye ve depo etiketleri isteğe bağlıdır."
        entries={entries}
        sites={sites}
        warehouses={warehouses}
        defaultSiteId={siteId ?? ""}
        defaultWarehouseId={warehouseId ?? ""}
        showTags={!siteId && !warehouseId}
      />
    </div>
  );
}
