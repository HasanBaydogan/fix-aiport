"use client";

import { useTransition } from "react";
import { reorderCategory } from "@/lib/actions";

export function CategoryReorderButtons({
  categoryId,
  canMoveUp,
  canMoveDown,
}: {
  categoryId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await reorderCategory(categoryId, direction);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={pending || !canMoveUp}
        className="rounded-lg px-2 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-40"
        aria-label="Yukarı taşı"
        onClick={() => move("up")}
      >
        ↑
      </button>
      <button
        type="button"
        disabled={pending || !canMoveDown}
        className="rounded-lg px-2 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-40"
        aria-label="Aşağı taşı"
        onClick={() => move("down")}
      >
        ↓
      </button>
    </div>
  );
}
