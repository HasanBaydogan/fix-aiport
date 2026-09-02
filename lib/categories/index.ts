export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};

export type CategoryTreeNode = CategoryRow & { children: CategoryTreeNode[] };

export type CategoryDisplayRow = CategoryRow & {
  depth: number;
  siblingIndex: number;
  siblingCount: number;
};

/** @deprecated Use pinColorForCategory — kept for backward compatibility */
export const MAIN_CATEGORY_PIN_COLORS: Record<string, string> = {
  insaat: "#1557b8",
  yapi: "#059669",
  tamirat: "#d97706",
  "ic-mimari": "#7c3aed",
  "dis-mimari": "#dc2626",
};

export const PIN_COLOR_PALETTE = [
  "#1557b8",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#be185d",
  "#4f46e5",
  "#ca8a04",
  "#0d9488",
];

export const DEFAULT_PIN_COLOR = "#64748b";

export function getMainCategories(categories: CategoryRow[]): CategoryRow[] {
  return categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getSubcategories(
  categories: CategoryRow[],
  parentId: string,
): CategoryRow[] {
  return getChildren(categories, parentId);
}

export function getChildren(
  categories: CategoryRow[],
  parentId: string,
): CategoryRow[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getRootCategory(
  categoryId: string | null | undefined,
  categories: CategoryRow[],
): CategoryRow | null {
  if (!categoryId) return null;
  let current = categories.find((c) => c.id === categoryId);
  if (!current) return null;
  const seen = new Set<string>();
  while (current.parent_id) {
    if (seen.has(current.id)) return null;
    seen.add(current.id);
    const parent = categories.find((c) => c.id === current!.parent_id);
    if (!parent) return current;
    current = parent;
  }
  return current;
}

/** Kök kategoriye çıkar — getRootCategory ile aynı (sınırsız derinlik). */
export function resolveMainCategory(
  categoryId: string | null | undefined,
  categories: CategoryRow[],
): CategoryRow | null {
  return getRootCategory(categoryId, categories);
}

export function getDescendantIds(
  categoryId: string,
  categories: CategoryRow[],
): string[] {
  const result: string[] = [];
  for (const child of getChildren(categories, categoryId)) {
    result.push(child.id);
    result.push(...getDescendantIds(child.id, categories));
  }
  return result;
}

export function buildCategoryTree(categories: CategoryRow[]): CategoryTreeNode[] {
  const byParent = new Map<string | null, CategoryRow[]>();

  for (const category of categories) {
    const key = category.parent_id;
    const list = byParent.get(key);
    if (list) list.push(category);
    else byParent.set(key, [category]);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }

  function build(parentId: string | null): CategoryTreeNode[] {
    return (byParent.get(parentId) ?? []).map((category) => ({
      ...category,
      children: build(category.id),
    }));
  }

  return build(null);
}

export function flattenTreeForDisplay(tree: CategoryTreeNode[]): CategoryDisplayRow[] {
  const result: CategoryDisplayRow[] = [];

  function walk(nodes: CategoryTreeNode[], depth: number) {
    nodes.forEach((node, index) => {
      result.push({
        id: node.id,
        name: node.name,
        slug: node.slug,
        parent_id: node.parent_id,
        sort_order: node.sort_order,
        depth,
        siblingIndex: index,
        siblingCount: nodes.length,
      });
      walk(node.children, depth + 1);
    });
  }

  walk(tree, 0);
  return result;
}

export function flattenCategoryOptions(
  categories: CategoryRow[],
  excludeIds: string[] = [],
): { value: string; label: string }[] {
  const exclude = new Set(excludeIds);
  const tree = buildCategoryTree(categories);
  const options: { value: string; label: string }[] = [];

  function walk(nodes: CategoryTreeNode[], depth: number) {
    for (const node of nodes) {
      if (!exclude.has(node.id)) {
        options.push({
          value: node.id,
          label: `${depth > 0 ? "— ".repeat(depth) : ""}${node.name}`,
        });
        walk(node.children, depth + 1);
      }
    }
  }

  walk(tree, 0);
  return options;
}

export function wouldCreateCycle(
  categoryId: string,
  newParentId: string | null,
  categories: CategoryRow[],
): boolean {
  if (!newParentId) return false;
  if (categoryId === newParentId) return true;
  return getDescendantIds(categoryId, categories).includes(newParentId);
}

export function getNextSiblingSortOrder(
  categories: CategoryRow[],
  parentId: string | null,
): number {
  const siblings = categories.filter((c) => c.parent_id === parentId);
  if (siblings.length === 0) return 10;
  return Math.max(...siblings.map((s) => s.sort_order)) + 10;
}

export function pinColorForCategory(
  categoryId: string | null | undefined,
  categories: CategoryRow[],
): string {
  const root = getRootCategory(categoryId, categories);
  if (!root) return DEFAULT_PIN_COLOR;

  const legacy = MAIN_CATEGORY_PIN_COLORS[root.slug];
  if (legacy) return legacy;

  const roots = getMainCategories(categories);
  const index = roots.findIndex((r) => r.id === root.id);
  if (index < 0) return DEFAULT_PIN_COLOR;
  return PIN_COLOR_PALETTE[index % PIN_COLOR_PALETTE.length];
}

export function matchesCategoryFilter(
  productCategoryId: string | null | undefined,
  filterCategoryId: string | undefined,
  categories: CategoryRow[],
): boolean {
  if (!filterCategoryId) return true;
  if (!productCategoryId) return false;

  const allowed = categoryIdsForFilter(filterCategoryId, categories);
  if (!allowed) return true;
  return allowed.includes(productCategoryId);
}

export function categoryIdsForFilter(
  filterCategoryId: string | undefined,
  categories: CategoryRow[],
): string[] | null {
  if (!filterCategoryId) return null;
  const filter = categories.find((c) => c.id === filterCategoryId);
  if (!filter) return null;
  return [filterCategoryId, ...getDescendantIds(filterCategoryId, categories)];
}

export function getCategoryPathLabel(
  categoryId: string,
  categories: CategoryRow[],
): string {
  const parts: string[] = [];
  let current = categories.find((c) => c.id === categoryId);
  const seen = new Set<string>();

  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    parts.unshift(current.name);
    current = current.parent_id
      ? categories.find((c) => c.id === current!.parent_id)
      : undefined;
  }

  return parts.join(" › ");
}
