"use client";

import { useState, useTransition } from "react";
import {
  createPurchaseListItemOffer,
  updatePurchaseListItemOffer,
  deletePurchaseListItemOffer,
} from "@/lib/actions";
import { inputClass, buttonPrimaryClass } from "@/lib/forms/types";
import { formatMoney } from "@/lib/purchases";
import type {
  PurchaseListItem,
  PurchaseListItemOffer,
} from "@/lib/supabase/database.types";

type SupplierOption = { id: string; org_name: string };

function offerDisplayName(offer: PurchaseListItemOffer): string {
  const supplier = offer.supplier_profiles?.org_name;
  const place = offer.place_name?.trim();
  if (supplier && place) return `${supplier} · ${place}`;
  return supplier ?? place ?? "—";
}

function OfferForm({
  itemId,
  suppliers,
  offer,
  onDone,
}: {
  itemId: string;
  suppliers: SupplierOption[];
  offer?: PurchaseListItemOffer;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-2 space-y-2 rounded-lg border border-brand-100 bg-white p-3"
      action={(formData) => {
        setError(null);
        if (offer) formData.set("id", offer.id);
        else formData.set("list_item_id", itemId);
        startTransition(async () => {
          const result = offer
            ? await updatePurchaseListItemOffer(formData)
            : await createPurchaseListItemOffer(formData);
          if (result.error) setError(result.error);
          else onDone();
        });
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Tedarikçi (opsiyonel)</label>
          <select
            name="supplier_profile_id"
            defaultValue={offer?.supplier_profile_id ?? ""}
            className={inputClass(false)}
          >
            <option value="">— Seçilmedi —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.org_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Yer adı (opsiyonel)</label>
          <input
            name="place_name"
            defaultValue={offer?.place_name ?? ""}
            placeholder="Mağaza, pazar yeri…"
            className={inputClass(false)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Birim fiyat</label>
          <input
            name="unit_price"
            type="number"
            step="0.01"
            defaultValue={
              offer?.unit_price != null ? String(offer.unit_price) : ""
            }
            className={inputClass(false)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Not</label>
          <input
            name="notes"
            defaultValue={offer?.notes ?? ""}
            className={inputClass(false)}
          />
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonPrimaryClass}>
          {pending ? "…" : offer ? "Güncelle" : "Ekle"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm"
          onClick={onDone}
        >
          İptal
        </button>
      </div>
    </form>
  );
}

export function PurchaseListItemOffers({
  item,
  suppliers,
}: {
  item: PurchaseListItem;
  suppliers: SupplierOption[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const offers = item.purchase_list_item_offers ?? [];

  return (
    <div className="mt-3 border-t border-brand-100 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Satılan yerler & fiyatlar
      </p>
      {offers.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {offers.map((offer) =>
            editingId === offer.id ? (
              <li key={offer.id}>
                <OfferForm
                  itemId={item.id}
                  suppliers={suppliers}
                  offer={offer}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={offer.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50/50 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-brand-900">
                    {offerDisplayName(offer)}
                  </span>
                  {offer.unit_price != null ? (
                    <span className="ml-2 text-brand-700">
                      {formatMoney(Number(offer.unit_price), offer.currency)}
                    </span>
                  ) : null}
                  {offer.notes ? (
                    <p className="text-xs text-slate-500">{offer.notes}</p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-xs text-brand-700 hover:bg-brand-100"
                    onClick={() => setEditingId(offer.id)}
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePurchaseListItemOffer(offer.id);
                      })
                    }
                  >
                    Sil
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-slate-500">Henüz teklif eklenmedi.</p>
      )}
      {adding ? (
        <OfferForm
          itemId={item.id}
          suppliers={suppliers}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-brand-600 hover:underline"
          onClick={() => setAdding(true)}
        >
          + Yer / fiyat ekle
        </button>
      )}
    </div>
  );
}
