"use client";

import { useTransition } from "react";
import { deleteSupplierProduct } from "@/lib/actions";

export function DeleteSupplierProductButton({
  productId,
}: {
  productId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      onClick={() => {
        if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
          await deleteSupplierProduct(productId);
        });
      }}
    >
      {pending ? "…" : "Sil"}
    </button>
  );
}
