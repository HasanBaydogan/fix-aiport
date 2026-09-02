"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { Field } from "@/components/forms/fields/Field";
import { FormShell } from "@/components/forms/FormShell";
import { inputClass, type FormStatus } from "@/lib/forms/types";

export function AuthForm({
  mode,
  nextPath,
}: {
  mode: "login" | "signup";
  nextPath?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "E-posta zorunludur.";
    if (password.length < 6) next.password = "Şifre en az 6 karakter olmalıdır.";
    if (mode === "signup" && !displayName.trim()) {
      next.displayName = "Ad soyad zorunludur.";
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle" });
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw error;
        setStatus({
          type: "success",
          message:
            "Hesabınız oluşturuldu. E-posta onayını kontrol edin veya giriş yapın.",
        });
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.push(safeRedirectPath(nextPath));
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
      submitLabel={mode === "login" ? "Giriş yap" : "Kayıt ol"}
      framed={false}
      footer={
        mode === "login" ? (
          <div className="mt-3 text-right text-sm">
            <Link href="/sifremi-unuttum" className="font-medium text-brand-600 hover:underline">
              Şifremi unuttum
            </Link>
          </div>
        ) : null
      }
    >
      {mode === "signup" ? (
        <Field id="displayName" label="Ad Soyad" required error={errors.displayName}>
          <input
            id="displayName"
            className={inputClass(Boolean(errors.displayName))}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>
      ) : null}
      <div className={mode === "signup" ? "mt-5" : undefined}>
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
      </div>
      <div className="mt-5">
        <Field id="password" label="Şifre" required error={errors.password}>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={inputClass(Boolean(errors.password))}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </div>
    </FormShell>
  );
}
