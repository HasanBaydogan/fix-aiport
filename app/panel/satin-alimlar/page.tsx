import { createPurchase } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  ActionForm,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/forms/ActionForm";
import { LocationPicker } from "@/components/map/LocationPicker";
import { PurchaseListPanel } from "@/components/panel/PurchaseListPanel";
import { SiteFilterBadge } from "@/components/panel/SiteFilterBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

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
        .limit(50);
      if (siteId) q = q.eq("site_id", siteId);
      return q;
    })(),
  ]);

  const { data: purchases } = await purchasesQuery;
  const filteredSite = siteId ? (sites ?? []).find((s) => s.id === siteId) : null;
  const today = new Date().toISOString().slice(0, 10);
  const totalSpend = (purchases ?? []).reduce(
    (sum, row) => sum + (row.unit_price != null ? Number(row.unit_price) * Number(row.qty) : 0),
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Satın alma"
        title="Satın alımlarım"
        description="Kendi kayıtlarınız. İsteğe bağlı konum işaretlerseniz haritada görünür (onay sonrası)."
        actions={
          totalSpend > 0 ? (
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-2 text-sm">
              <span className="text-slate-500">Toplam harcama</span>
              <p className="font-semibold text-brand-900">{totalSpend.toFixed(2)} TRY</p>
            </div>
          ) : null
        }
      />

      {filteredSite ? (
        <SiteFilterBadge siteName={filteredSite.name} clearHref="/panel/satin-alimlar" />
      ) : null}

      <SectionCard title="Satın alma ekle" defaultOpen>
        <ActionForm action={createPurchase} submitLabel="Satın alma ekle">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              name="site_id"
              label="Şantiye"
              required
              defaultValue={siteId}
              options={(sites ?? []).map((s) => ({ value: s.id, label: s.name }))}
            />
            <TextInput name="product_name" label="Ürün" required />
            <TextInput name="qty" label="Miktar" required type="number" step="0.001" />
            <TextInput name="unit" label="Birim" defaultValue="adet" />
            <TextInput name="unit_price" label="Birim fiyat (TRY)" type="number" step="0.01" />
            <TextInput name="purchased_at" label="Tarih" type="date" defaultValue={today} />
            <TextInput name="supplier_ref" label="Tedarikçi / satıcı adı" />
            <TextInput
              name="purchase_location_label"
              label="Konum etiketi"
              placeholder="Örn. Depo girişi, mağaza adı"
            />
          </div>
          <TextArea name="notes" label="Not" />
          <details className="rounded-2xl border border-brand-100 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand-900">
              Nereden aldınız? (isteğe bağlı harita)
            </summary>
            <div className="mt-4">
              <LocationPicker optional />
            </div>
          </details>
        </ActionForm>
      </SectionCard>

      <PurchaseListPanel purchases={(purchases ?? []) as never} showSite={!siteId} />
    </div>
  );
}
