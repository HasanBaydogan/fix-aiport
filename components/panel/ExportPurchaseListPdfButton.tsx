"use client";

import { useState, useTransition } from "react";
import { exportPurchaseListPdf } from "@/lib/pdf/export-purchase-list";
import type { PurchaseListItem } from "@/lib/supabase/database.types";

export function ExportPurchaseListPdfButton({
  items,
  siteLabel,
}: {
  items: PurchaseListItem[];
  siteLabel?: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || items.length === 0}
      className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50 disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          await exportPurchaseListPdf(items, { siteLabel });
        })
      }
    >
      {pending ? "PDF…" : "PDF indir"}
    </button>
  );
}
