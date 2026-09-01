import { createStock } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  ActionForm,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/forms/ActionForm";
import { SiteFilterBadge } from "@/components/panel/SiteFilterBadge";
import { StockList } from "@/components/panel/StockList";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<{ site_id?: string }>;
}) {
  const { site_id: siteId } = await searchParams;
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/stok");

  const [{ data: sites }, stockQuery] = await Promise.all([
    session.supabase
      .from("sites")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    (() => {
      let q = session.supabase
        .from("site_stock")
        .select("*, sites(name)")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (siteId) q = q.eq("site_id", siteId);
      return q;
    })(),
  ]);

  const { data: stock } = await stockQuery;
  const filteredSite = siteId ? (sites ?? []).find((s) => s.id === siteId) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Stok"
        title="Stok yönetimi"
        description="Şantiye bazlı private stok kayıtları (R7). Birim: adet, kg, m² vb."
      />

      {filteredSite ? (
        <SiteFilterBadge siteName={filteredSite.name} clearHref="/panel/stok" />
      ) : null}

      <SectionCard title="Stok kaydı ekle">
        <ActionForm action={createStock} submitLabel="Stok kaydı ekle">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              name="site_id"
              label="Şantiye"
              required
              defaultValue={siteId}
              options={(sites ?? []).map((s) => ({ value: s.id, label: s.name }))}
            />
            <TextInput name="product_name" label="Ürün / malzeme" required />
            <TextInput name="qty" label="Miktar" required type="number" step="0.001" />
            <TextInput name="unit" label="Birim" defaultValue="adet" />
          </div>
          <TextArea name="notes" label="Not" />
        </ActionForm>
      </SectionCard>

      <StockList rows={(stock ?? []) as never} showSite={!siteId} />
    </div>
  );
}
