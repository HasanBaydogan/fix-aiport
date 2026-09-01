import { ReactNode } from "react";

export function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-brand-900">
        {label}
        {required ? <span className="ml-1 text-brand-600">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
