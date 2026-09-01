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

  const [{ data: sites }, itemsQuery] = await Promise.all([
    session.supabase
      .from("sites")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    (() => {
      let q = session.supabase
        .from("purchase_list_items")
        .select("*, sites(name)")
        .is("archived_at", null)
        .order("priority", { ascending: false })
        .limit(50);
      if (siteId) q = q.eq("site_id", siteId);
      return q;
    })(),
  ]);

  const { data: items } = await itemsQuery;
  const filteredSite = siteId ? (sites ?? []).find((s) => s.id === siteId) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Alışveriş listesi"
        title="Satın alınacaklar"
        description="Şantiye alışveriş listesi — private veri (R7). Yüksek öncelik üstte listelenir."
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

      <PurchaseListItemsList items={(items ?? []) as never} showSite={!siteId} />
    </div>
  );
}
