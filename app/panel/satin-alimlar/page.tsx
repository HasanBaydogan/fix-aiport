import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { PurchaseListPanel } from "@/components/panel/PurchaseListPanel";
import { PurchaseCreateForm } from "@/components/panel/PurchaseCreateForm";
import { ExportPurchasesPdfButton } from "@/components/panel/ExportPurchasesPdfButton";
import { SiteFilterBadge } from "@/components/panel/SiteFilterBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatMoney, purchaseLineTotal } from "@/lib/purchases";

export default async function SatinAlimlarPage({
  searchParams,
}: {
  searchParams: Promise<{ site_id?: string }>;
}) {
  const { site_id: siteId } = await searchParams;
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/satin-alimlar");

  const [{ data: sites }, purchasesQuery] = await Promise.all([
    session.supabase
      .from("sites")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    (() => {
      let q = session.supabase
        .from("purchases")
        .select("*, sites(name)")
        .is("archived_at", null)
        .order("purchased_at", { ascending: false })
        .limit(200);
      if (siteId) q = q.eq("site_id", siteId);
      return q;
    })(),
  ]);

  const { data: purchases } = await purchasesQuery;
  const filteredSite = siteId ? (sites ?? []).find((s) => s.id === siteId) : null;
  const today = new Date().toISOString().slice(0, 10);
  const purchaseRows = purchases ?? [];
  const totalSpend = purchaseRows.reduce((sum, row) => {
    const line = purchaseLineTotal(
      row.unit_price != null ? Number(row.unit_price) : null,
      Number(row.qty),
    );
    return sum + (line ?? 0);
  }, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Satın alma"
        title="Satın alımlarım"
        description="Kendi kayıtlarınız. Ürün adına tıklayarak fiyat geçmişini görün. İsteğe bağlı fatura ekleyebilirsiniz."
        actions={
          <>
            <ExportPurchasesPdfButton
              purchases={purchaseRows as never}
              siteLabel={filteredSite?.name}
            />
            {totalSpend > 0 ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-2 text-sm">
                <span className="text-slate-500">Toplam harcama</span>
                <p className="font-semibold text-brand-900">{formatMoney(totalSpend)}</p>
              </div>
            ) : null}
          </>
        }
      />

      {filteredSite ? (
        <SiteFilterBadge siteName={filteredSite.name} clearHref="/panel/satin-alimlar" />
      ) : null}

      <SectionCard title="Satın alma ekle" defaultOpen>
        <PurchaseCreateForm
          sites={(sites ?? []) as { id: string; name: string }[]}
          defaultSiteId={siteId}
          today={today}
        />
      </SectionCard>

      <PurchaseListPanel
        purchases={purchaseRows as never}
        showSite={!siteId}
        siteId={siteId}
      />
    </div>
  );
}
