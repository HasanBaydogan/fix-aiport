import { sectionTitleClass } from "@/lib/ui/classes";

export function SectionCard({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-2xl border border-brand-100 bg-white/60"
    >
      <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
        <span className={sectionTitleClass}>{title}</span>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </summary>
      <div className="border-t border-brand-100 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        {children}
      </div>
    </details>
  );
}
