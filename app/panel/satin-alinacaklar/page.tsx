import { createPurchaseListItem } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  ActionForm,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/forms/ActionForm";
import { PurchaseListItemsList } from "@/components/panel/PurchaseListItemsList";
import { ExportPurchaseListPdfButton } from "@/components/panel/ExportPurchaseListPdfButton";
import { SiteFilterBadge } from "@/components/panel/SiteFilterBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default async function SatinAlinacaklarPage({
  searchParams,
}: {
  searchParams: Promise<{ site_id?: string }>;
}) {
  const { site_id: siteId } = await searchParams;
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/satin-alinacaklar");

  const [{ data: sites }, itemsQuery, { data: suppliers }] = await Promise.all([
    session.supabase
      .from("sites")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    (() => {
      let q = session.supabase
        .from("purchase_list_items")
        .select(
          "*, sites(name), purchase_list_item_offers(*, supplier_profiles(org_name))",
        )
        .is("archived_at", null)
        .order("priority", { ascending: false })
        .limit(200);
      if (siteId) q = q.eq("site_id", siteId);
      return q;
    })(),
    session.supabase
      .from("supplier_profiles")
      .select("id, org_name")
      .eq("status", "published")
      .order("org_name"),
  ]);

  const { data: items } = await itemsQuery;
  const filteredSite = siteId ? (sites ?? []).find((s) => s.id === siteId) : null;
  const itemRows = items ?? [];
  const supplierOptions = (suppliers ?? []) as { id: string; org_name: string }[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Alışveriş listesi"
        title="Satın alınacaklar"
        description="Her kalem için satılan yerleri ve fiyatları ekleyin. Yüksek öncelik üstte listelenir."
        actions={
          <ExportPurchaseListPdfButton
            items={itemRows as never}
            siteLabel={filteredSite?.name}
          />
        }
      />

      {filteredSite ? (
        <SiteFilterBadge
          siteName={filteredSite.name}
          clearHref="/panel/satin-alinacaklar"
        />
      ) : null}

      <SectionCard title="Listeye ekle">
        <ActionForm action={createPurchaseListItem} submitLabel="Listeye ekle">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              name="site_id"
              label="Şantiye"
              required
              defaultValue={siteId}
              options={(sites ?? []).map((s) => ({ value: s.id, label: s.name }))}
            />
            <TextInput name="product_name" label="Ürün" required />
            <TextInput name="qty" label="Miktar" type="number" step="0.001" defaultValue="1" />
            <TextInput name="unit" label="Birim" defaultValue="adet" />
            <TextInput name="priority" label="Öncelik (0–10)" type="number" defaultValue="0" />
          </div>
          <TextArea name="notes" label="Not" />
        </ActionForm>
      </SectionCard>

      <PurchaseListItemsList
        items={itemRows as never}
        showSite={!siteId}
        suppliers={supplierOptions}
      />
    </div>
  );
}
