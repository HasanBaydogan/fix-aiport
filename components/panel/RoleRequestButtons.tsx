"use client";

import { useTransition } from "react";
import { reviewRoleRequest } from "@/lib/actions";

export function RoleRequestButtons({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await reviewRoleRequest(requestId, "approved");
          })
        }
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Onayla
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await reviewRoleRequest(requestId, "rejected");
          })
        }
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
      >
        Reddet
      </button>
    </div>
  );
}
