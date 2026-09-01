import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurchaseRowActions } from "@/components/panel/PurchaseRowActions";
import { listPanelClass } from "@/lib/ui/classes";
import type { Purchase } from "@/lib/supabase/database.types";

export function PurchaseListPanel({
  purchases,
  showSite = true,
  showActions = true,
  compact = false,
  viewAllHref,
}: {
  purchases: Purchase[];
  showSite?: boolean;
  showActions?: boolean;
  compact?: boolean;
  viewAllHref?: string;
}) {
  if (!purchases.length) {
    return (
      <EmptyState
        title="Henüz satın alma kaydı yok"
        description="Yukarıdaki formdan alım ekleyin veya alışveriş listesinden satın alındı işaretleyin."
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
      <div className="hidden overflow-x-auto rounded-2xl border border-brand-100 md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-brand-50 text-brand-900">
            <tr>
              <th className="px-4 py-3">Tarih</th>
              {showSite ? <th className="px-4 py-3">Şantiye</th> : null}
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Miktar</th>
              {!compact ? <th className="px-4 py-3">Fiyat</th> : null}
              {showActions ? <th className="px-4 py-3">İşlem</th> : null}
            </tr>
          </thead>
          <tbody>
            {purchases.map((row) => (
              <tr key={row.id} className="border-t border-brand-100 align-top">
                <td className="px-4 py-3">{row.purchased_at.slice(0, 10)}</td>
                {showSite ? (
                  <td className="px-4 py-3">{row.sites?.name ?? "—"}</td>
                ) : null}
                <td className="px-4 py-3 font-medium">{row.product_name}</td>
                <td className="px-4 py-3">
                  {row.qty} {row.unit}
                </td>
                {!compact ? (
                  <td className="px-4 py-3">
                    {row.unit_price != null ? `${row.unit_price} ${row.currency}` : "—"}
                  </td>
                ) : null}
                {showActions ? (
                  <td className="px-4 py-3">
                    <PurchaseRowActions row={row} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={`${listPanelClass} md:hidden`}>
        {purchases.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <div className="flex justify-between gap-2">
              <p className="font-medium text-brand-900">{row.product_name}</p>
              <span className="text-xs text-slate-500">{row.purchased_at.slice(0, 10)}</span>
            </div>
            <p className="text-slate-600">
              {showSite ? `${row.sites?.name ?? "—"} · ` : ""}
              {row.qty} {row.unit}
              {row.unit_price != null ? ` · ${row.unit_price} ${row.currency}` : ""}
            </p>
            {showActions ? (
              <div className="mt-2">
                <PurchaseRowActions row={row} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
