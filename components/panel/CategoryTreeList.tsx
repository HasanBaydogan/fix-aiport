"use client";

import { useState } from "react";
import { updateCategory } from "@/lib/actions";
import type { CategoryDisplayRow, CategoryRow } from "@/lib/categories";
import {
  buildCategoryTree,
  flattenCategoryOptions,
  flattenTreeForDisplay,
  getDescendantIds,
} from "@/lib/categories";
import {
  ActionForm,
  SelectInput,
  TextInput,
} from "@/components/forms/ActionForm";
import { CategoryDeleteButton } from "@/components/panel/CategoryDeleteButton";
import { CategoryReorderButtons } from "@/components/panel/CategoryReorderButtons";
import { listPanelClass } from "@/lib/ui/classes";

export function CategoryTreeList({ categories }: { categories: CategoryRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const rows = flattenTreeForDisplay(buildCategoryTree(categories));

  if (rows.length === 0) return null;

  return (
    <ul className={listPanelClass}>
      {rows.map((row: CategoryDisplayRow) => (
        <li key={row.id} className="text-sm">
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            style={{ paddingLeft: `${16 + row.depth * 20}px` }}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-900">{row.name}</p>
              <p className="text-slate-500">
                {row.slug} · sıra {row.sort_order}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryReorderButtons
                categoryId={row.id}
                canMoveUp={row.siblingIndex > 0}
                canMoveDown={row.siblingIndex < row.siblingCount - 1}
              />
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                onClick={() => setEditingId(editingId === row.id ? null : row.id)}
              >
                {editingId === row.id ? "Kapat" : "Düzenle"}
              </button>
              <CategoryDeleteButton categoryId={row.id} />
            </div>
          </div>
          {editingId === row.id ? (
            <CategoryEditPanel
              category={row}
              categories={categories}
              onCancel={() => setEditingId(null)}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CategoryEditPanel({
  category,
  categories,
  onCancel,
}: {
  category: CategoryRow;
  categories: CategoryRow[];
  onCancel: () => void;
}) {
  const parentOptions = flattenCategoryOptions(categories, [
    category.id,
    ...getDescendantIds(category.id, categories),
  ]);

  return (
    <div className="border-t border-brand-100 bg-brand-50/30 px-4 py-4">
      <ActionForm action={updateCategory} submitLabel="Güncelle">
        <input type="hidden" name="id" value={category.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="name" label="Ad" required defaultValue={category.name} />
          <TextInput name="slug" label="Slug" required defaultValue={category.slug} />
          <SelectInput
            name="parent_id"
            label="Üst kategori"
            defaultValue={category.parent_id ?? ""}
            options={parentOptions}
          />
          <TextInput
            name="sort_order"
            label="Sıra"
            type="number"
            defaultValue={String(category.sort_order)}
          />
        </div>
      </ActionForm>
      <button
        type="button"
        className="mt-3 text-sm font-medium text-slate-600 hover:text-brand-900"
        onClick={onCancel}
      >
        İptal
      </button>
    </div>
  );
}
