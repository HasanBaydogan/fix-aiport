"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/forms/fields/Field";
import { FormShell } from "@/components/forms/FormShell";
import { inputClass, type FormStatus } from "@/lib/forms/types";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 6) next.password = "Şifre en az 6 karakter olmalıdır.";
    if (password !== confirm) next.confirm = "Şifreler eşleşmiyor.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus({ type: "success", message: "Şifreniz güncellendi. Yönlendiriliyorsunuz…" });
      router.push("/panel");
      router.refresh();
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
      submitLabel="Şifreyi güncelle"
      framed={false}
    >
      <Field id="password" label="Yeni şifre" required error={errors.password}>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass(Boolean(errors.password))}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <div className="mt-5">
        <Field id="confirm" label="Yeni şifre (tekrar)" required error={errors.confirm}>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            className={inputClass(Boolean(errors.confirm))}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>
    </FormShell>
  );
}
