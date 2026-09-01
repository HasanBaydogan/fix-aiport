"use client";

import { FormEvent, ReactNode } from "react";
import { buttonPrimaryClass, cardClass, type FormStatus } from "@/lib/forms/types";

export function FormShell({
  children,
  onSubmit,
  submitting,
  status,
  submitLabel,
  honeypot,
  onHoneypotChange,
  encType,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitting?: boolean;
  status: FormStatus;
  submitLabel: string;
  honeypot?: string;
  onHoneypotChange?: (value: string) => void;
  encType?: string;
}) {
  if (status.type === "success") {
    return (
      <div className={`${cardClass} text-center`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-brand-900">Kaydedildi</h2>
        <p className="mt-3 text-base leading-7 text-slate-600">{status.message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      encType={encType}
      className={`relative ${cardClass}`}
    >
      {children}

      {onHoneypotChange ? (
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="website_hp">Website</label>
          <input
            id="website_hp"
            name="_honeypot"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot ?? ""}
            onChange={(e) => onHoneypotChange(e.target.value)}
          />
        </div>
      ) : null}

      {status.type === "error" ? (
        <p
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {status.message}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className={`mt-6 ${buttonPrimaryClass}`}>
        {submitting ? "Kaydediliyor..." : submitLabel}
      </button>
    </form>
  );
}
