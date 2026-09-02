"use client";

import { useEffect, useState, useTransition } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getPurchasePriceHistory } from "@/lib/actions";
import { formatMoney } from "@/lib/purchases";
import type { PurchasePriceHistoryRow } from "@/lib/purchases";

export function PurchasePriceHistoryPanel({
  productName,
  siteId,
  onClose,
}: {
  productName: string;
  siteId?: string | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<PurchasePriceHistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getPurchasePriceHistory(productName, siteId);
      if (result.error) setError(result.error);
      else setRows(result.rows);
    });
  }, [productName, siteId]);

  const chartData = rows
    .filter((r) => r.unit_price != null)
    .map((r) => ({
      date: r.purchased_at.slice(0, 10),
      price: Number(r.unit_price),
      label: formatMoney(Number(r.unit_price), r.currency),
    }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-history-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Fiyat geçmişi
            </p>
            <h2 id="price-history-title" className="mt-1 text-lg font-semibold text-brand-900">
              {productName}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            Kapat
          </button>
        </div>

        {pending ? (
          <p className="mt-6 text-sm text-slate-500">Yükleniyor…</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Bu ürün için satın alma kaydı bulunamadı.
          </p>
        ) : (
          <>
            {chartData.length >= 2 ? (
              <div className="mt-6 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={48} />
                    <Tooltip
                      formatter={(v) =>
                        v != null && v !== "" ? formatMoney(Number(v)) : "—"
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#1e3a5f"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : chartData.length === 1 ? (
              <p className="mt-4 text-sm text-slate-500">
                Grafik için en az 2 fiyatlı kayıt gerekir.
              </p>
            ) : null}

            <div className="mt-6 overflow-x-auto rounded-xl border border-brand-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-brand-50 text-brand-900">
                  <tr>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2">Şantiye</th>
                    <th className="px-3 py-2">Birim fiyat</th>
                    <th className="px-3 py-2">Miktar</th>
                    <th className="px-3 py-2">Tedarikçi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-brand-100">
                      <td className="px-3 py-2">{row.purchased_at.slice(0, 10)}</td>
                      <td className="px-3 py-2">{row.site_name}</td>
                      <td className="px-3 py-2">
                        {row.unit_price != null
                          ? formatMoney(row.unit_price, row.currency)
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row.qty} {row.unit}
                      </td>
                      <td className="px-3 py-2">{row.supplier_ref ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
