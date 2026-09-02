"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/forms/fields/Field";
import { FormShell } from "@/components/forms/FormShell";
import { inputClass, type FormStatus } from "@/lib/forms/types";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setErrors({ email: "E-posta zorunludur." });
      return;
    }
    setErrors({});
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/sifre-yenile")}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) throw error;
      setStatus({
        type: "success",
        message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "İşlem başarısız.",
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
      submitLabel="Bağlantı gönder"
      framed={false}
    >
      <Field id="email" label="E-posta" required error={errors.email}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass(Boolean(errors.email))}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
    </FormShell>
  );
}
