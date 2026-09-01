import type { ContentStatus } from "@/lib/supabase/database.types";

export {
  inputClass,
  buttonPrimaryClass,
  cardClass,
} from "@/lib/forms/types";

export const buttonSecondaryClass =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50";

export const buttonCompactClass =
  "inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70";

export const listPanelClass =
  "divide-y divide-brand-100 rounded-2xl border border-brand-100 bg-white";

export const pageEyebrowClass =
  "text-sm font-semibold uppercase tracking-wide text-brand-600";

export const sectionTitleClass = "text-lg font-semibold text-brand-900";

export function badgeClass(status: ContentStatus | string): string {
  const base = "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold";
  switch (status) {
    case "published":
      return `${base} bg-emerald-50 text-emerald-700`;
    case "pending":
      return `${base} bg-amber-50 text-amber-700`;
    case "rejected":
      return `${base} bg-red-50 text-red-700`;
    case "draft":
      return `${base} bg-slate-100 text-slate-600`;
    case "archived":
      return `${base} bg-slate-100 text-slate-500`;
    default:
      return `${base} bg-brand-50 text-brand-700`;
  }
}

export const heroGradientClass =
  "rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/40 to-brand-100/30 p-8 shadow-[0_20px_60px_rgba(21,87,184,0.08)] sm:p-12";

export const iconBoxClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20";
