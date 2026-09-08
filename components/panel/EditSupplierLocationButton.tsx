"use client";

import { useState } from "react";
import { updateSupplierLocation } from "@/lib/actions";
import { ActionForm, TextInput } from "@/components/forms/ActionForm";
import { LocationPicker } from "@/components/map/LocationPicker";
import { buttonCompactClass } from "@/lib/ui/classes";

export function EditSupplierLocationButton({
  locationId,
  label,
  lat,
  lng,
}: {
  locationId: string;
  label: string | null;
  lat: number;
  lng: number;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonCompactClass}
      >
        Düzenle
      </button>
    );
  }

  return (
    <div className="w-full min-w-[16rem] space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3 sm:min-w-[20rem]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-brand-900">Pin düzenle</p>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-brand-800"
          onClick={() => setOpen(false)}
        >
          Kapat
        </button>
      </div>
      <ActionForm
        action={async (formData) => {
          formData.set("id", locationId);
          const result = await updateSupplierLocation(formData);
          if (!result.error) setOpen(false);
          return result;
        }}
        submitLabel="Kaydet"
      >
        <TextInput
          name="label"
          label="Etiket"
          defaultValue={label ?? ""}
          placeholder="Depo / şube adı"
        />
        <LocationPicker defaultLat={lat} defaultLng={lng} />
      </ActionForm>
    </div>
  );
}
