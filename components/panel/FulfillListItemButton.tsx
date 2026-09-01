"use client";

import { useState, useTransition } from "react";
import { fulfillPurchaseListItem } from "@/lib/actions";
import { inputClass, buttonPrimaryClass } from "@/lib/forms/types";
import type { PurchaseListItem } from "@/lib/supabase/database.types";

export function FulfillListItemButton({ item }: { item: PurchaseListItem }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  if (!open) {
    return (
      <button
        type="button"
        className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700"
        onClick={() => setOpen(true)}
      >
        Satın alındı
      </button>
    );
  }

  return (
    <form
      className="mt-2 w-full space-y-2 rounded-xl border border-brand-200 bg-white p-3 shadow-sm"
      action={(formData) => {
        setError(null);
        formData.set("list_item_id", item.id);
        startTransition(async () => {
          const result = await fulfillPurchaseListItem(formData);
          if (result.error) setError(result.error);
          else setOpen(false);
        });
      }}
    >
      <p className="text-xs font-semibold text-brand-900">
        {item.product_name} · {item.qty} {item.unit}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Birim fiyat (TRY)</label>
          <input name="unit_price" type="number" step="0.01" className={inputClass(false)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Tarih</label>
          <input
            name="purchased_at"
            type="date"
            defaultValue={today}
            className={inputClass(false)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-600">Tedarikçi (opsiyonel)</label>
          <input name="supplier_ref" className={inputClass(false)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input name="add_to_stock" type="checkbox" defaultChecked className="rounded" />
        Stoka ekle
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonPrimaryClass}>
          {pending ? "…" : "Onayla"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm"
          onClick={() => setOpen(false)}
        >
          İptal
        </button>
      </div>
    </form>
  );
}
