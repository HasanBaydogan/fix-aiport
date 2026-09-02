"use client";

import { useEffect, useState, useTransition } from "react";
import { fulfillPurchaseListItem } from "@/lib/actions";
import { PurchasePriceFields } from "@/components/panel/PurchasePriceFields";
import { inputClass, buttonPrimaryClass } from "@/lib/forms/types";
import { formatMoney } from "@/lib/purchases";
import type {
  PurchaseListItem,
  PurchaseListItemOffer,
} from "@/lib/supabase/database.types";

type SupplierOption = { id: string; org_name: string };

function offerLabel(offer: PurchaseListItemOffer): string {
  const supplier = offer.supplier_profiles?.org_name;
  const place = offer.place_name?.trim();
  if (supplier && place) return `${supplier} · ${place}`;
  return supplier ?? place ?? "Teklif";
}

export function FulfillListItemButton({
  item,
  suppliers: _suppliers,
}: {
  item: PurchaseListItem;
  suppliers?: SupplierOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const offers = item.purchase_list_item_offers ?? [];

  useEffect(() => {
    if (!selectedOfferId) return;
    const offer = offers.find((o) => o.id === selectedOfferId);
    if (!offer) return;
    if (offer.unit_price != null) {
      setUnitPrice(String(offer.unit_price));
    }
    const orgName = offer.supplier_profiles?.org_name;
    setSupplierRef(orgName ?? offer.place_name?.trim() ?? "");
  }, [selectedOfferId, offers]);

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
        if (selectedOfferId) formData.set("offer_id", selectedOfferId);
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
      <input type="hidden" name="qty" value={String(item.qty)} />
      {offers.length > 0 ? (
        <div>
          <label className="mb-1 block text-xs text-slate-600">
            Tekliften doldur (opsiyonel)
          </label>
          <select
            value={selectedOfferId}
            onChange={(e) => setSelectedOfferId(e.target.value)}
            className={inputClass(false)}
          >
            <option value="">— Manuel giriş —</option>
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offerLabel(offer)}
                {offer.unit_price != null
                  ? ` · ${formatMoney(Number(offer.unit_price), offer.currency)}`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <PurchasePriceFields
          compact
          defaultQty={Number(item.qty)}
          defaultUnitPrice={unitPrice ? Number(unitPrice) : undefined}
          key={`${selectedOfferId}-${unitPrice}`}
        />
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
          <input
            name="supplier_ref"
            value={supplierRef}
            onChange={(e) => setSupplierRef(e.target.value)}
            className={inputClass(false)}
          />
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
