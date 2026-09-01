export type DataScope = "private" | "global";

export type FormStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export const inputClass = (hasError: boolean): string =>
  `w-full rounded-2xl border bg-white px-4 py-3 text-sm text-brand-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-brand-200 focus:border-brand-600 focus:ring-brand-100"
  }`;

export const buttonPrimaryClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";

export const cardClass =
  "rounded-3xl border border-brand-100 bg-white p-5 shadow-[0_20px_60px_rgba(21,87,184,0.08)] sm:p-8";
