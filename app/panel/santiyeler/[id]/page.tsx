import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { PurchaseListItemsList } from "@/components/panel/PurchaseListItemsList";
import { PurchaseListPanel } from "@/components/panel/PurchaseListPanel";
import { DailyLogSection } from "@/components/panel/DailyLogSection";
import { StockList } from "@/components/panel/StockList";
import { StatTile } from "@/components/ui/StatTile";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  fetchDailyLogEntries,
  fetchSiteAndWarehouseOptions,
} from "@/lib/daily-log";

export default async function SantiyeDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) redirect(`/giris?next=/panel/santiyeler/${id}`);

  const { data: site } = await session.supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (!site) redirect("/panel/santiyeler");

  const [
    { data: stock },
    { data: purchases },
    { data: list },
    { sites, warehouses },
    progressWithUrls,
    { data: suppliers },
  ] = await Promise.all([
    session.supabase
      .from("site_stock")
      .select("*, sites(name)")
      .eq("site_id", id)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
    session.supabase
      .from("purchases")
      .select("*, sites(name)")
      .eq("site_id", id)
      .is("archived_at", null)
      .order("purchased_at", { ascending: false })
      .limit(20),
    session.supabase
      .from("purchase_list_items")
      .select(
        "*, sites(name), purchase_list_item_offers(*, supplier_profiles(org_name))",
      )
      .eq("site_id", id)
      .is("archived_at", null)
      .order("priority", { ascending: false })
      .limit(20),
    fetchSiteAndWarehouseOptions(session.supabase),
    fetchDailyLogEntries(session.supabase, { siteId: id }),
    session.supabase
      .from("supplier_profiles")
      .select("id, org_name")
      .eq("status", "published")
      .order("org_name"),
  ]);

  const supplierOptions = (suppliers ?? []) as { id: string; org_name: string }[];

  const stockHref = `/panel/stok?site_id=${id}`;
  const purchasesHref = `/panel/satin-alimlar?site_id=${id}`;
  const listHref = `/panel/satin-alinacaklar?site_id=${id}`;
  const gunlukHref = `/panel/gunluk?site_id=${id}`;

  return (
    <div className="space-y-8">
      <nav className="text-sm">
        <Link href="/panel/santiyeler" className="text-brand-600 hover:underline">
          ← Şantiyeler
        </Link>
      </nav>
      <PageHeader
        title={site.name}
        description={site.address || "Adres belirtilmemiş — şantiye ayarlarından ekleyebilirsiniz."}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Günlük"
          value={progressWithUrls.length}
          href={gunlukHref}
          hint="Tüm kayıtlar →"
        />
        <StatTile
          label="Stok kalemi"
          value={stock?.length ?? 0}
          href={stockHref}
          hint="Stok sayfası →"
        />
        <StatTile
          label="Satın alma"
          value={purchases?.length ?? 0}
          href={purchasesHref}
          hint="Alımlar →"
        />
        <StatTile
          label="Alınacak"
          value={list?.length ?? 0}
          href={listHref}
          hint="Liste →"
        />
      </div>

      <DailyLogSection
        title="Şantiye günlüğü"
        description="Bu şantiyeye bağlı günlük kayıtları. İsteğe bağlı depo da etiketleyebilirsiniz."
        entries={progressWithUrls}
        sites={sites}
        warehouses={warehouses}
        defaultSiteId={id}
        lockSite
        showTags
      />

      <SectionCard title="Stok">
        <StockList
          rows={(stock ?? []) as never}
          showSite={false}
          compact
          viewAllHref={stockHref}
        />
      </SectionCard>

      <SectionCard title="Satın alımlar">
        <PurchaseListPanel
          purchases={(purchases ?? []) as never}
          showSite={false}
          compact
          viewAllHref={purchasesHref}
          siteId={id}
        />
      </SectionCard>

      <SectionCard title="Satın alınacaklar">
        <PurchaseListItemsList
          items={(list ?? []) as never}
          showSite={false}
          viewAllHref={listHref}
          suppliers={supplierOptions}
        />
      </SectionCard>
    </div>
  );
}
