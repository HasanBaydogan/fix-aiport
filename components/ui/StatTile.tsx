import Link from "next/link";

export function StatTile({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string | number;
  href?: string;
  hint?: string;
}) {
  const className =
    "group rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50";
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-brand-900">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500 group-hover:text-brand-600">{hint}</p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
