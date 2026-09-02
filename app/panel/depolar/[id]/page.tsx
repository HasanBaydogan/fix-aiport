import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { DailyLogSection } from "@/components/panel/DailyLogSection";
import { StatTile } from "@/components/ui/StatTile";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  fetchDailyLogEntries,
  fetchSiteAndWarehouseOptions,
} from "@/lib/daily-log";

export default async function DepoDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) redirect(`/giris?next=/panel/depolar/${id}`);

  const { data: warehouse } = await session.supabase
    .from("warehouses")
    .select("*")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (!warehouse) redirect("/panel/depolar");

  const [{ sites, warehouses }, entries] = await Promise.all([
    fetchSiteAndWarehouseOptions(session.supabase),
    fetchDailyLogEntries(session.supabase, { warehouseId: id }),
  ]);

  const gunlukHref = `/panel/gunluk?warehouse_id=${id}`;

  return (
    <div className="space-y-8">
      <nav className="text-sm">
        <Link href="/panel/depolar" className="text-brand-600 hover:underline">
          ← Depolar
        </Link>
      </nav>
      <PageHeader
        title={warehouse.name}
        description={
          warehouse.address ||
          warehouse.notes ||
          "Depo günlüğünü aşağıdan tutabilirsiniz."
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Günlük kaydı"
          value={entries.length}
          href={gunlukHref}
          hint="Tüm kayıtlar →"
        />
        <StatTile
          label="Adres"
          value={warehouse.address ? "Var" : "—"}
          hint={warehouse.address ?? "Adres eklenmemiş"}
        />
      </div>

      <DailyLogSection
        title="Depo günlüğü"
        description="Bu depoya bağlı günlük kayıtları. İsteğe bağlı şantiye de etiketleyebilirsiniz."
        entries={entries}
        sites={sites}
        warehouses={warehouses}
        defaultWarehouseId={id}
        lockWarehouse
        showTags
      />
    </div>
  );
}
