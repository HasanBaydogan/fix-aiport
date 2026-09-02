/** Line total from unit price × quantity. */
export function purchaseLineTotal(
  unitPrice: number | null | undefined,
  qty: number | null | undefined,
): number | null {
  if (unitPrice == null || qty == null) return null;
  return Number(unitPrice) * Number(qty);
}

export function formatMoney(amount: number, currency = "TRY"): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/** Prefer unit_price; otherwise derive from total_price ÷ qty. */
export function resolveUnitPrice(
  unitPrice: number | null,
  totalPrice: number | null,
  qty: number | null,
): number | null {
  if (unitPrice != null) return unitPrice;
  if (totalPrice != null && qty != null && qty !== 0) {
    return Math.round((totalPrice / qty) * 100) / 100;
  }
  return null;
}

/** Normalize product name for price-history matching (Turkish locale). */
export function normalizeProductName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, " ");
}

export function productNamesMatch(a: string, b: string): boolean {
  return normalizeProductName(a) === normalizeProductName(b);
}

export type PurchasePriceHistoryRow = {
  id: string;
  purchased_at: string;
  site_name: string;
  unit_price: number | null;
  qty: number;
  unit: string;
  currency: string;
  supplier_ref: string | null;
};
