"use client";

import { useTransition } from "react";
import { moderateContent } from "@/lib/actions";
import type { ContentStatus } from "@/lib/supabase/database.types";

export function ModerateButtons({
  table,
  id,
}: {
  table:
    | "products"
    | "supplier_profiles"
    | "supplier_locations"
    | "user_product_locations";
  id: string;
}) {
  const [pending, start] = useTransition();

  function act(status: ContentStatus) {
    start(async () => {
      await moderateContent(table, id, status);
    });
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => act("published")}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Yayınla
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => act("rejected")}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
      >
        Reddet
      </button>
    </div>
  );
}
