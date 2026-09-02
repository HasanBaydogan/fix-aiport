import type { ReactNode } from "react";
import { inputClass } from "@/lib/forms/types";
import type { CategoryRow } from "@/lib/categories";
import { buildCategoryTree, type CategoryTreeNode } from "@/lib/categories";

function renderCategoryOptions(nodes: CategoryTreeNode[], depth = 0): ReactNode[] {
  return nodes.flatMap((node) => {
    const prefix = depth > 0 ? "— ".repeat(depth) : "";
    const option = (
      <option key={node.id} value={node.id}>
        {prefix}
        {node.name}
      </option>
    );
    if (node.children.length === 0) return [option];
    return [option, ...renderCategoryOptions(node.children, depth + 1)];
  });
}

export function CategorySelect({
  name,
  label,
  required,
  categories,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  categories: CategoryRow[];
  defaultValue?: string;
}) {
  const tree = buildCategoryTree(categories);

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-900" htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-brand-600">*</span> : null}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={inputClass(false)}
      >
        <option value="">Seçin…</option>
        {renderCategoryOptions(tree)}
      </select>
    </div>
  );
}
