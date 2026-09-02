"use client";

import { useState, useTransition } from "react";
import { exportPurchasesPdf } from "@/lib/pdf/export-purchases";
import type { Purchase } from "@/lib/supabase/database.types";

export function ExportPurchasesPdfButton({
  purchases,
  siteLabel,
}: {
  purchases: Purchase[];
  siteLabel?: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || purchases.length === 0}
      className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50 disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          await exportPurchasesPdf(purchases, { siteLabel });
        })
      }
    >
      {pending ? "PDF…" : "PDF indir"}
    </button>
  );
}
