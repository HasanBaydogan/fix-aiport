"use client";

import { useTransition } from "react";

export function ArchiveRecordButton({
  label = "Arşivle",
  onArchive,
}: {
  label?: string;
  onArchive: () => Promise<{ error?: string; ok?: boolean }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      onClick={() => {
        if (!confirm("Bu kaydı arşivlemek istediğinize emin misiniz?")) return;
        startTransition(async () => {
          await onArchive();
        });
      }}
    >
      {pending ? "…" : label}
    </button>
  );
}
