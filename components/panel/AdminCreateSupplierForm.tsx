"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCreateSupplier } from "@/lib/admin/suppliers";
import { TextInput } from "@/components/forms/ActionForm";
import { inputClass, buttonPrimaryClass } from "@/lib/forms/types";

type BuyerOption = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export function AdminCreateSupplierForm({ buyers }: { buyers: BuyerOption[] }) {
  const [ownerMode, setOwnerMode] = useState<"existing" | "invite">("existing");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError(null);
        setMessage(null);
        formData.set("owner_mode", ownerMode);
        start(async () => {
          const result = await adminCreateSupplier(formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setMessage(result.message ?? "Oluşturuldu.");
          if (result.profileId) {
            router.push(`/panel/admin/tedarikciler/${result.profileId}`);
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="org_name" label="Ticari unvan" required />
        <TextInput name="city" label="Şehir" />
        <TextInput name="district" label="İlçe" />
        <TextInput name="public_phone" label="İş telefonu" />
        <TextInput name="website" label="Web sitesi" />
        <TextInput name="category_focus" label="Kategori odağı" />
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-900">Sahip</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="owner_mode_ui"
              checked={ownerMode === "existing"}
              onChange={() => setOwnerMode("existing")}
            />
            Mevcut alıcı
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="owner_mode_ui"
              checked={ownerMode === "invite"}
              onChange={() => setOwnerMode("invite")}
            />
            E-posta ile davet
          </label>
        </div>

        {ownerMode === "existing" ? (
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-brand-900"
              htmlFor="user_id"
            >
              Kullanıcı
              <span className="ml-1 text-brand-600">*</span>
            </label>
            <select
              id="user_id"
              name="user_id"
              required={ownerMode === "existing"}
              className={inputClass(false)}
              defaultValue=""
            >
              <option value="" disabled>
                Alıcı seçin…
              </option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {(b.display_name || "İsimsiz") +
                    (b.email ? ` · ${b.email}` : "")}
                </option>
              ))}
            </select>
            {buyers.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Atanabilir alıcı yok. E-posta daveti kullanın.
              </p>
            ) : null}
          </div>
        ) : (
          <TextInput
            name="invite_email"
            label="Davet e-postası"
            type="email"
            required
            placeholder="firma@ornek.com"
          />
        )}
      </fieldset>

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
        {pending ? "Oluşturuluyor…" : "Tedarikçi oluştur"}
      </button>
    </form>
  );
}
