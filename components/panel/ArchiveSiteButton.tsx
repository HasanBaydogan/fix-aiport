"use client";

import { useTransition } from "react";
import { archiveSite } from "@/lib/actions";

export function ArchiveSiteButton({ siteId }: { siteId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      onClick={() =>
        startTransition(async () => {
          await archiveSite(siteId);
        })
      }
    >
      {pending ? "…" : "Arşivle"}
    </button>
  );
}
