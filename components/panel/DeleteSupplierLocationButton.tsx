"use client";

import { useTransition } from "react";
import { deleteSupplierLocation } from "@/lib/actions";

export function DeleteSupplierLocationButton({
  locationId,
}: {
  locationId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      onClick={() => {
        if (!window.confirm("Bu pini silmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
          await deleteSupplierLocation(locationId);
        });
      }}
    >
      {pending ? "…" : "Sil"}
    </button>
  );
}
