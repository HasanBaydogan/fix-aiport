import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurchaseListRowActions } from "@/components/panel/PurchaseListRowActions";
import { listPanelClass } from "@/lib/ui/classes";
import type { PurchaseListItem } from "@/lib/supabase/database.types";

function priorityBadge(priority: number) {
  if (priority >= 8) return "bg-red-50 text-red-700";
  if (priority >= 5) return "bg-amber-50 text-amber-700";
  return "bg-brand-50 text-brand-700";
}

export function PurchaseListItemsList({
  items,
  showSite = true,
  showActions = true,
  viewAllHref,
}: {
  items: PurchaseListItem[];
  showSite?: boolean;
  showActions?: boolean;
  viewAllHref?: string;
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="Alışveriş listesi boş"
        description="Şantiye için ihtiyaç duyduğunuz malzemeleri ekleyin."
        primaryHref="/panel/satin-alimlar"
        primaryLabel="Satın alım ekle"
      />
    );
  }

  return (
    <>
      {viewAllHref ? (
        <div className="flex justify-end">
          <Link href={viewAllHref} className="text-sm font-medium text-brand-600 hover:underline">
            Tümünü gör →
          </Link>
        </div>
      ) : null}
      <ul className={listPanelClass}>
        {items.map((item) => (
          <li key={item.id} className="px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-brand-900">{item.product_name}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityBadge(item.priority)}`}
              >
                öncelik {item.priority}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {showSite ? `${item.sites?.name ?? "—"} · ` : ""}
              {item.qty} {item.unit}
            </p>
            {item.notes ? <p className="mt-1 text-xs text-slate-500">{item.notes}</p> : null}
            {showActions ? (
              <div className="mt-3">
                <PurchaseListRowActions row={item} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
