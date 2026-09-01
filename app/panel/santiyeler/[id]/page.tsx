import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { PurchaseListItemsList } from "@/components/panel/PurchaseListItemsList";
import { PurchaseListPanel } from "@/components/panel/PurchaseListPanel";
import { StockList } from "@/components/panel/StockList";
import { StatTile } from "@/components/ui/StatTile";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

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

  const [{ data: stock }, { data: purchases }, { data: list }] = await Promise.all([
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
      .select("*, sites(name)")
      .eq("site_id", id)
      .is("archived_at", null)
      .order("priority", { ascending: false })
      .limit(20),
  ]);

  const stockHref = `/panel/stok?site_id=${id}`;
  const purchasesHref = `/panel/satin-alimlar?site_id=${id}`;
  const listHref = `/panel/satin-alinacaklar?site_id=${id}`;

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
      <div className="grid gap-3 sm:grid-cols-3">
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
        />
      </SectionCard>

      <SectionCard title="Satın alınacaklar">
        <PurchaseListItemsList
          items={(list ?? []) as never}
          showSite={false}
          viewAllHref={listHref}
        />
      </SectionCard>
    </div>
  );
}
