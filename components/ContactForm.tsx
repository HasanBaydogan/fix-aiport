"use client";

import { FormEvent, ReactNode, useMemo, useRef, useState } from "react";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_EXTENSIONS,
  FormErrors,
  FormValues,
  MAX_FILE_COUNT,
  formatFileSize,
  getSubmitKitEndpoint,
  getTotalSize,
  mergeFiles,
  validateValues,
} from "@/lib/form";

const INITIAL_VALUES: FormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  message: "",
};

type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_SUBMITKIT_FORM_ID ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const totalSize = useMemo(() => getTotalSize(files), [files]);

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function addFiles(incoming: File[]) {
    const result = mergeFiles(files, incoming);
    setFiles(result.files);
    setErrors((current) => ({ ...current, files: result.error }));
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
    setErrors((current) => ({ ...current, files: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "idle" });

    if (honeypot.trim()) {
      setStatus({
        type: "success",
        message: "Formunuz alındı. En kısa sürede sizinle iletişime geçilecektir.",
      });
      return;
    }

    const nextErrors = validateValues(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!formId) {
      setStatus({
        type: "error",
        message:
          "Gönderim yapılandırması eksik. NEXT_PUBLIC_SUBMITKIT_FORM_ID değerini ekleyin.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("email", values.email.trim());
      formData.append("telefon", values.phone.trim());
      formData.append("adres", values.address.trim());
      formData.append("aciklama", values.message.trim());
      formData.append("_honeypot", "");
      formData.append("_timestamp", String(Date.now()));

      files.forEach((file, index) => {
        formData.append(`ek_${index + 1}`, file, file.name);
      });

      const response = await fetch(getSubmitKitEndpoint(formId), {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type") ?? "";
      let message = "Gönderim sırasında bir hata oluştu.";

      if (contentType.includes("application/json")) {
        const payload = (await response.json()) as {
          success?: boolean;
          ok?: boolean;
          message?: string;
          error?: string;
        };
        message = payload.message || payload.error || message;

        if (!response.ok || payload.success === false || payload.ok === false) {
          throw new Error(message);
        }
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || message);
        }
      }

      setValues(INITIAL_VALUES);
      setFiles([]);
      setErrors({});
      setHoneypot("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setStatus({
        type: "success",
        message: "Formunuz alındı. En kısa sürede sizinle iletişime geçilecektir.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Gönderim başarısız oldu. Lütfen tekrar deneyin.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (status.type === "success") {
    return (
      <div className="rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-[0_20px_60px_rgba(21,87,184,0.08)] sm:p-10">
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
        <h2 className="text-2xl font-semibold text-brand-900">Mesajınız iletildi</h2>
        <p className="mt-3 text-base leading-7 text-slate-600">{status.message}</p>
        <button
          type="button"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-110"
          onClick={() => setStatus({ type: "idle" })}
        >
          Yeni form gönder
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      encType="multipart/form-data"
      className="relative rounded-3xl border border-brand-100 bg-white p-5 shadow-[0_20px_60px_rgba(21,87,184,0.08)] sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Ad Soyad" required error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={inputClass(Boolean(errors.name))}
            placeholder="Adınız ve soyadınız"
          />
        </Field>

        <Field id="phone" label="Telefon" required error={errors.phone}>
          <input
            id="phone"
            name="telefon"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className={inputClass(Boolean(errors.phone))}
            placeholder="05xx xxx xx xx"
          />
        </Field>

        <Field id="email" label="E-posta" required error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={inputClass(Boolean(errors.email))}
            placeholder="ornek@mail.com"
          />
        </Field>

        <Field id="address" label="Adres" required error={errors.address}>
          <input
            id="address"
            name="adres"
            type="text"
            autoComplete="street-address"
            value={values.address}
            onChange={(event) => updateField("address", event.target.value)}
            className={inputClass(Boolean(errors.address))}
            placeholder="Mahalle, sokak, ilçe, il"
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field id="message" label="Açıklama" required error={errors.message}>
          <textarea
            id="message"
            name="aciklama"
            rows={5}
            value={values.message}
            onChange={(event) => updateField("message", event.target.value)}
            className={`${inputClass(Boolean(errors.message))} resize-y min-h-32`}
            placeholder="Talebinizi veya sorununuzu kısaca yazın"
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-end justify-between gap-3">
          <label htmlFor="attachments" className="text-sm font-semibold text-brand-900">
            Ekler
          </label>
          <span className="text-xs text-slate-500">
            {files.length}/{MAX_FILE_COUNT} dosya · {formatFileSize(totalSize)} · max 5 MB/dosya
          </span>
        </div>

        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addFiles(Array.from(event.dataTransfer.files));
          }}
          className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragActive
              ? "border-brand-600 bg-brand-50"
              : errors.files
                ? "border-red-400 bg-red-50"
                : "border-brand-200 bg-brand-50/60"
          }`}
        >
          <input
            ref={fileInputRef}
            id="attachments"
            name="attachment"
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <p className="text-sm font-medium text-brand-900">
            Dosyaları sürükleyip bırakın veya{" "}
            <button
              type="button"
              className="text-brand-600 underline-offset-2 hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              bilgisayardan seçin
            </button>
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            En fazla {MAX_FILE_COUNT} dosya, her biri en fazla 5 MB. Desteklenen türler:{" "}
            {ALLOWED_EXTENSIONS.join(", ")}.
          </p>
        </div>
        {errors.files ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {errors.files}
          </p>
        ) : null}

        {files.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={() => removeFile(index)}
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="_honeypot"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {status.type === "error" ? (
        <p
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {status.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Gönderiliyor..." : "Formu Gönder"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-brand-900">
        {label}
        {required ? <span className="ml-1 text-brand-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-2xl border bg-white px-4 py-3 text-sm text-brand-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-brand-200 focus:border-brand-600 focus:ring-brand-100"
  }`;
}
