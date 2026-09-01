"use client";

import React, { useTransition } from "react";
import { inputClass, buttonPrimaryClass } from "@/lib/forms/types";

export function ActionForm({
  action,
  children,
  submitLabel,
}: {
  action: (
    formData: FormData,
  ) => Promise<{ error?: string; ok?: boolean; message?: string }>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await action(formData);
          if (result.error) setError(result.error);
          else setMessage(result.message ?? "Kaydedildi.");
        });
      }}
    >
      {children}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
          {message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={buttonPrimaryClass}>
        {pending ? "Kaydediliyor..." : submitLabel}
      </button>
    </form>
  );
}

export function TextInput({
  name,
  label,
  required,
  type = "text",
  defaultValue,
  placeholder,
  step,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-900" htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-brand-600">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        className={inputClass(false)}
      />
    </div>
  );
}

export function TextArea({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-900" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`${inputClass(false)} min-h-24 resize-y`}
      />
    </div>
  );
}

export function SelectInput({
  name,
  label,
  required,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
