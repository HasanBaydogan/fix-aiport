export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};

/** Pin rengi yalnızca ana kategoriye göre; alt kategoriler aynı rengi kullanır. */
export const MAIN_CATEGORY_PIN_COLORS: Record<string, string> = {
  insaat: "#1557b8",
  yapi: "#059669",
  tamirat: "#d97706",
  "ic-mimari": "#7c3aed",
  "dis-mimari": "#dc2626",
};

export const DEFAULT_PIN_COLOR = "#64748b";

export function getMainCategories(categories: CategoryRow[]): CategoryRow[] {
  return categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
}

export function getSubcategories(
  categories: CategoryRow[],
  parentId: string,
): CategoryRow[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function resolveMainCategory(
  categoryId: string | null | undefined,
  categories: CategoryRow[],
): CategoryRow | null {
  if (!categoryId) return null;
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return null;
  if (!cat.parent_id) return cat;
  return categories.find((c) => c.id === cat.parent_id) ?? null;
}

export function pinColorForCategory(
  categoryId: string | null | undefined,
  categories: CategoryRow[],
): string {
  const main = resolveMainCategory(categoryId, categories);
  if (!main) return DEFAULT_PIN_COLOR;
  return MAIN_CATEGORY_PIN_COLORS[main.slug] ?? DEFAULT_PIN_COLOR;
}

/** Ana veya alt kategori filtresine göre category_id eşleşmesi. */
export function matchesCategoryFilter(
  productCategoryId: string | null | undefined,
  filterCategoryId: string | undefined,
  categories: CategoryRow[],
): boolean {
  if (!filterCategoryId) return true;
  if (!productCategoryId) return false;

  const filter = categories.find((c) => c.id === filterCategoryId);
  if (!filter) return true;

  if (!filter.parent_id) {
    const childIds = categories
      .filter((c) => c.parent_id === filter.id)
      .map((c) => c.id);
    return productCategoryId === filter.id || childIds.includes(productCategoryId);
  }

  return productCategoryId === filterCategoryId;
}

export function categoryIdsForFilter(
  filterCategoryId: string | undefined,
  categories: CategoryRow[],
): string[] | null {
  if (!filterCategoryId) return null;
  const filter = categories.find((c) => c.id === filterCategoryId);
  if (!filter) return null;
  if (!filter.parent_id) {
    return [
      filter.id,
      ...categories.filter((c) => c.parent_id === filter.id).map((c) => c.id),
    ];
  }
  return [filterCategoryId];
}
