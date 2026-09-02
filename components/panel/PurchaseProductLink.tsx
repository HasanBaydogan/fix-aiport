"use client";

import { useState } from "react";
import { PurchasePriceHistoryPanel } from "@/components/panel/PurchasePriceHistoryPanel";

export function PurchaseProductLink({
  productName,
  siteId,
}: {
  productName: string;
  siteId?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="text-left font-medium text-brand-800 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-600"
        onClick={() => setOpen(true)}
      >
        {productName}
      </button>
      {open ? (
        <PurchasePriceHistoryPanel
          productName={productName}
          siteId={siteId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
