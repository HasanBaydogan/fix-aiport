"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/lib/actions";

export function CategoryDeleteButton({ categoryId }: { categoryId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      onClick={() => {
        if (!window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
          await deleteCategory(categoryId);
        });
      }}
    >
      {pending ? "…" : "Sil"}
    </button>
  );
}
