import { inputClass } from "@/lib/forms/types";
import type { CategoryRow } from "@/lib/categories";
import { getMainCategories, getSubcategories } from "@/lib/categories";

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
  const mains = getMainCategories(categories);

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
        {mains.map((main) => {
          const subs = getSubcategories(categories, main.id);
          if (subs.length === 0) {
            return (
              <option key={main.id} value={main.id}>
                {main.name}
              </option>
            );
          }
          return (
            <optgroup key={main.id} label={main.name}>
              {subs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
