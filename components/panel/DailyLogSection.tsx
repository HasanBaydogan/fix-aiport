import { DailyLogForm } from "@/components/panel/DailyLogForm";
import { DailyLogTimeline } from "@/components/panel/DailyLogTimeline";
import { SectionCard } from "@/components/ui/SectionCard";
import type { SiteProgressEntry } from "@/lib/supabase/database.types";

type Option = { id: string; name: string };

export function DailyLogSection({
  title = "Günlük",
  description = "Tarih, not ve fotoğraf ekleyerek günlük tutun.",
  entries,
  sites,
  warehouses,
  defaultSiteId,
  defaultWarehouseId,
  lockSite = false,
  lockWarehouse = false,
  showTags = true,
}: {
  title?: string;
  description?: string;
  entries: SiteProgressEntry[];
  sites: Option[];
  warehouses: Option[];
  defaultSiteId?: string;
  defaultWarehouseId?: string;
  lockSite?: boolean;
  lockWarehouse?: boolean;
  showTags?: boolean;
}) {
  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-6">
        <DailyLogForm
          sites={sites}
          warehouses={warehouses}
          defaultSiteId={defaultSiteId}
          defaultWarehouseId={defaultWarehouseId}
          lockSite={lockSite}
          lockWarehouse={lockWarehouse}
        />
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-900">Kayıtlar</h3>
          <DailyLogTimeline entries={entries} showTags={showTags} />
        </div>
      </div>
    </SectionCard>
  );
}
