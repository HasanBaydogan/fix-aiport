"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "@/lib/forms/types";
import { purchaseLineTotal } from "@/lib/purchases";

function parseOptional(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatAmount(n: number | null): string {
  if (n == null) return "";
  return String(Math.round(n * 100) / 100);
}

function readQty(form: HTMLFormElement | null): number | null {
  if (!form) return null;
  const el = form.elements.namedItem("qty");
  if (!(el instanceof HTMLInputElement)) return null;
  return parseOptional(el.value);
}

export function PurchasePriceFields({
  defaultUnitPrice = null,
  defaultQty = null,
  currency = "TRY",
  compact = false,
}: {
  defaultUnitPrice?: number | null;
  defaultQty?: number | null;
  currency?: string;
  /** Smaller labels for inline edit / fulfill forms */
  compact?: boolean;
}) {
  const unitId = useId();
  const totalId = useId();
  const unitInputRef = useRef<HTMLInputElement>(null);
  const initialTotal = purchaseLineTotal(defaultUnitPrice, defaultQty);
  const [unitPrice, setUnitPrice] = useState(formatAmount(defaultUnitPrice));
  const [totalPrice, setTotalPrice] = useState(formatAmount(initialTotal));
  const unitPriceRef = useRef(unitPrice);
  unitPriceRef.current = unitPrice;

  useEffect(() => {
    const form = unitInputRef.current?.form;
    const qtyInput = form?.elements.namedItem("qty");
    if (!(qtyInput instanceof HTMLInputElement)) return;

    const syncTotalFromUnit = () => {
      const unit = parseOptional(unitPriceRef.current);
      const qty = parseOptional(qtyInput.value);
      setTotalPrice(formatAmount(purchaseLineTotal(unit, qty)));
    };

    qtyInput.addEventListener("input", syncTotalFromUnit);
    return () => qtyInput.removeEventListener("input", syncTotalFromUnit);
  }, []);

  const labelClass = compact
    ? "mb-1 block text-xs text-slate-600"
    : "mb-2 block text-sm font-semibold text-brand-900";

  return (
    <>
      <div>
        <label className={labelClass} htmlFor={unitId}>
          Birim fiyat ({currency})
        </label>
        <input
          ref={unitInputRef}
          id={unitId}
          name="unit_price"
          type="number"
          step="0.01"
          value={unitPrice}
          className={inputClass(false)}
          placeholder="0.00"
          onChange={(e) => {
            const next = e.target.value;
            setUnitPrice(next);
            const unit = parseOptional(next);
            const qty = readQty(e.currentTarget.form);
            setTotalPrice(formatAmount(purchaseLineTotal(unit, qty)));
          }}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={totalId}>
          Toplam fiyat ({currency})
        </label>
        <input
          id={totalId}
          name="total_price"
          type="number"
          step="0.01"
          value={totalPrice}
          className={inputClass(false)}
          placeholder="0.00"
          onChange={(e) => {
            const next = e.target.value;
            setTotalPrice(next);
            const total = parseOptional(next);
            const qty = readQty(e.currentTarget.form);
            if (total != null && qty != null && qty !== 0) {
              setUnitPrice(formatAmount(Math.round((total / qty) * 100) / 100));
            } else if (!next.trim()) {
              setUnitPrice("");
            }
          }}
        />
      </div>
    </>
  );
}
