import Link from "next/link";
import { createWarehouse } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { ActionForm, TextArea, TextInput } from "@/components/forms/ActionForm";
import { ArchiveWarehouseButton } from "@/components/panel/ArchiveWarehouseButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

function formatShortDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

export default async function DepolarPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/depolar");

  const { data: warehouses } = await session.supabase
    .from("warehouses")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const warehouseIds = (warehouses ?? []).map((w) => w.id);
  const lastLogByWarehouse = new Map<string, string>();

  if (warehouseIds.length > 0) {
    const { data: logs } = await session.supabase
      .from("site_progress_entries")
      .select("warehouse_id, logged_at")
      .in("warehouse_id", warehouseIds)
      .is("archived_at", null)
      .order("logged_at", { ascending: false });

    for (const row of logs ?? []) {
      if (row.warehouse_id && !lastLogByWarehouse.has(row.warehouse_id)) {
        lastLogByWarehouse.set(row.warehouse_id, row.logged_at);
      }
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Depo"
        title="Depolarım"
        description="Depo günlüğü tutmak için depolarınızı yönetin. Private veri — yalnızca size görünür."
      />

      <SectionCard title="Yeni depo" description="Depo veya ambar adını ekleyin.">
        <ActionForm action={createWarehouse} submitLabel="Depo ekle">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label="Depo adı" required placeholder="Örn. Ana Depo" />
            <TextInput name="address" label="Adres" placeholder="İlçe, il" />
            <div className="sm:col-span-2">
              <TextArea name="notes" label="Not (isteğe bağlı)" placeholder="Depo hakkında kısa bilgi" />
            </div>
          </div>
        </ActionForm>
      </SectionCard>

      {(warehouses ?? []).length === 0 ? (
        <EmptyState
          title="Henüz depo yok"
          description="Yukarıdaki formu kullanarak ilk deponuzu ekleyin ve günlük tutmaya başlayın."
        />
      ) : (
        <ul className={listPanelClass}>
          {(warehouses ?? []).map((warehouse) => {
            const lastLog = lastLogByWarehouse.get(warehouse.id);
            return (
              <li
                key={warehouse.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <Link
                  href={`/panel/depolar/${warehouse.id}`}
                  className="flex min-w-0 gap-3 hover:underline"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg font-bold text-amber-800">
                    {warehouse.name.charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <p className="font-medium text-brand-900">{warehouse.name}</p>
                    <p className="text-sm text-slate-500">
                      {warehouse.address || "Adres yok"}
                      {lastLog ? ` · son günlük: ${formatShortDate(lastLog)}` : ""}
                    </p>
                  </span>
                </Link>
                <ArchiveWarehouseButton warehouseId={warehouse.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
