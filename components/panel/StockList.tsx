import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { StockRowActions } from "@/components/panel/StockRowActions";
import { listPanelClass } from "@/lib/ui/classes";
import type { SiteStock } from "@/lib/supabase/database.types";

export function StockList({
  rows,
  showSite = true,
  showActions = true,
  compact = false,
  viewAllHref,
}: {
  rows: SiteStock[];
  showSite?: boolean;
  showActions?: boolean;
  compact?: boolean;
  viewAllHref?: string;
}) {
  if (!rows.length) {
    return (
      <EmptyState
        title="Henüz stok kaydı yok"
        description="Şantiye seçerek malzeme girişi yapın. Stok verileri yalnızca size görünür."
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
              {showSite ? <th className="px-4 py-3">Şantiye</th> : null}
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Miktar</th>
              {!compact ? <th className="px-4 py-3">Not</th> : null}
              {showActions ? <th className="px-4 py-3">İşlem</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-brand-100 align-top">
                {showSite ? (
                  <td className="px-4 py-3">{row.sites?.name ?? "—"}</td>
                ) : null}
                <td className="px-4 py-3 font-medium">{row.product_name}</td>
                <td className="px-4 py-3">
                  {row.qty} {row.unit}
                </td>
                {!compact ? (
                  <td className="px-4 py-3 text-slate-500">{row.notes ?? "—"}</td>
                ) : null}
                {showActions ? (
                  <td className="px-4 py-3">
                    <StockRowActions row={row} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={`${listPanelClass} md:hidden`}>
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <p className="font-medium text-brand-900">{row.product_name}</p>
            <p className="text-slate-600">
              {showSite ? `${row.sites?.name ?? "—"} · ` : ""}
              {row.qty} {row.unit}
            </p>
            {row.notes ? <p className="mt-1 text-slate-500">{row.notes}</p> : null}
            {showActions ? (
              <div className="mt-2">
                <StockRowActions row={row} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
