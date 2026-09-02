"use client";

import { useState, useTransition } from "react";
import { updatePurchase, archivePurchase } from "@/lib/actions";
import { ArchiveRecordButton } from "@/components/panel/ArchiveRecordButton";
import { PurchaseInvoiceSection } from "@/components/panel/PurchaseInvoiceSection";
import { PurchasePriceFields } from "@/components/panel/PurchasePriceFields";
import { inputClass, buttonPrimaryClass } from "@/lib/forms/types";
import type { Purchase } from "@/lib/supabase/database.types";

export function PurchaseRowActions({ row }: { row: Purchase }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          onClick={() => setEditing(true)}
        >
          Düzenle
        </button>
        <PurchaseInvoiceSection row={row} />
        <ArchiveRecordButton onArchive={() => archivePurchase(row.id)} />
      </div>
    );
  }

  return (
    <form
      className="mt-2 space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3"
      action={(formData) => {
        setError(null);
        formData.set("id", row.id);
        startTransition(async () => {
          const result = await updatePurchase(formData);
          if (result.error) setError(result.error);
          else setEditing(false);
        });
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="product_name"
          defaultValue={row.product_name}
          required
          className={inputClass(false)}
        />
        <input
          name="purchased_at"
          type="date"
          defaultValue={row.purchased_at.slice(0, 10)}
          required
          className={inputClass(false)}
        />
        <input
          name="qty"
          type="number"
          step="0.001"
          defaultValue={String(row.qty)}
          required
          className={inputClass(false)}
        />
        <input name="unit" defaultValue={row.unit} className={inputClass(false)} />
        <PurchasePriceFields
          compact
          defaultUnitPrice={row.unit_price}
          defaultQty={Number(row.qty)}
          currency={row.currency}
        />
        <input
          name="supplier_ref"
          defaultValue={row.supplier_ref ?? ""}
          className={inputClass(false)}
          placeholder="Tedarikçi"
        />
      </div>
      <input
        name="notes"
        defaultValue={row.notes ?? ""}
        placeholder="Not"
        className={inputClass(false)}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonPrimaryClass}>
          {pending ? "…" : "Kaydet"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm"
          onClick={() => setEditing(false)}
        >
          İptal
        </button>
      </div>
    </form>
  );
}
