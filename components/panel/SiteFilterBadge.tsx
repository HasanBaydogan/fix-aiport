import Link from "next/link";

export function SiteFilterBadge({
  siteName,
  clearHref,
}: {
  siteName: string;
  clearHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-2 text-sm">
      <span className="text-slate-600">Filtre:</span>
      <span className="font-semibold text-brand-900">{siteName}</span>
      <Link href={clearHref} className="text-brand-600 hover:underline">
        Filtreyi kaldır
      </Link>
    </div>
  );
}
