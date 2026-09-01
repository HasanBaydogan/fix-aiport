"use client";

import { FormEvent, useState } from "react";
import { Field } from "@/components/forms/fields/Field";
import { FileDropzone } from "@/components/forms/fields/FileDropzone";
import { FormShell } from "@/components/forms/FormShell";
import {
  FormErrors,
  FormValues,
  getSubmitKitEndpoint,
  validateValues,
} from "@/lib/form";
import type { FormStatus } from "@/lib/forms/types";
import { inputClass } from "@/lib/forms/types";

const INITIAL: FormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  message: "",
};

/** Public, no-login repair request — SubmitKit (R5). Embeddable on any page. */
export default function RepairRequestForm() {
  const formId = process.env.NEXT_PUBLIC_SUBMITKIT_FORM_ID ?? "";
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: undefined }));
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
        headers: { Accept: "application/json" },
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
        if (!response.ok) throw new Error(text || message);
      }

      setValues(INITIAL);
      setFiles([]);
      setErrors({});
      setHoneypot("");
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

  return (
    <FormShell
      onSubmit={handleSubmit}
      submitting={submitting}
      status={status}
      submitLabel="Teklif Talebini Gönder"
      honeypot={honeypot}
      onHoneypotChange={setHoneypot}
      encType="multipart/form-data"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Ad Soyad" required error={errors.name}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass(Boolean(errors.name))}
            placeholder="Adınız ve soyadınız"
          />
        </Field>
        <Field id="phone" label="Telefon" required error={errors.phone}>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={inputClass(Boolean(errors.phone))}
            placeholder="05xx xxx xx xx"
          />
        </Field>
        <Field id="email" label="E-posta" required error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={inputClass(Boolean(errors.email))}
            placeholder="ornek@mail.com"
          />
        </Field>
        <Field id="address" label="Adres" required error={errors.address}>
          <input
            id="address"
            type="text"
            autoComplete="street-address"
            value={values.address}
            onChange={(e) => updateField("address", e.target.value)}
            className={inputClass(Boolean(errors.address))}
            placeholder="Mahalle, sokak, ilçe, il"
          />
        </Field>
      </div>
      <div className="mt-5">
        <Field id="message" label="Açıklama" required error={errors.message}>
          <textarea
            id="message"
            rows={5}
            value={values.message}
            onChange={(e) => updateField("message", e.target.value)}
            className={`${inputClass(Boolean(errors.message))} min-h-32 resize-y`}
            placeholder="Talep detaylarınız"
          />
        </Field>
      </div>
      <div className="mt-5">
        <FileDropzone
          files={files}
          error={errors.files}
          onChange={(next, err) => {
            setFiles(next);
            setErrors((c) => ({ ...c, files: err }));
          }}
        />
      </div>
    </FormShell>
  );
}
