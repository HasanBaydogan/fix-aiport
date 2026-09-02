"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileDropzone } from "@/components/forms/fields/FileDropzone";
import { SelectInput, TextArea, TextInput } from "@/components/forms/ActionForm";
import { createSiteProgressEntry } from "@/lib/actions";
import { validateDailyLog } from "@/lib/forms/schemas";
import { buttonPrimaryClass } from "@/lib/forms/types";
import {
  PROGRESS_IMAGE_ACCEPT,
  validateProgressFiles,
} from "@/lib/storage/site-progress";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

const emptyOption = { value: "", label: "— Seçilmedi —" };

type Option = { id: string; name: string };

export function DailyLogForm({
  sites,
  warehouses,
  defaultSiteId = "",
  defaultWarehouseId = "",
  lockSite = false,
  lockWarehouse = false,
}: {
  sites: Option[];
  warehouses: Option[];
  defaultSiteId?: string;
  defaultWarehouseId?: string;
  lockSite?: boolean;
  lockWarehouse?: boolean;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const siteOptions = [
    emptyOption,
    ...sites.map((s) => ({ value: s.id, label: s.name })),
  ];
  const warehouseOptions = [
    emptyOption,
    ...warehouses.map((w) => ({ value: w.id, label: w.name })),
  ];

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        const form = e.currentTarget;
        const fd = new FormData(form);
        const site_id = lockSite
          ? defaultSiteId
          : String(fd.get("site_id") ?? "");
        const warehouse_id = lockWarehouse
          ? defaultWarehouseId
          : String(fd.get("warehouse_id") ?? "");
        const logged_at = String(fd.get("logged_at") ?? "");
        const note = String(fd.get("note") ?? "");

        const fieldErrors = validateDailyLog(
          { site_id, warehouse_id, logged_at, note },
          files.length,
        );
        const photosError = validateProgressFiles(files);
        if (Object.keys(fieldErrors).length > 0 || photosError) {
          setError(
            photosError ??
              fieldErrors.files ??
              fieldErrors.logged_at ??
              fieldErrors.note ??
              "Formu kontrol edin.",
          );
          return;
        }

        const payload = new FormData();
        if (site_id) payload.set("site_id", site_id);
        if (warehouse_id) payload.set("warehouse_id", warehouse_id);
        payload.set("logged_at", logged_at);
        payload.set("note", note);
        for (const file of files) {
          payload.append("photos", file, file.name);
        }

        startTransition(async () => {
          const result = await createSiteProgressEntry(payload);
          if (result.error) {
            setError(result.error);
            return;
          }
          setMessage(result.message ?? "Kaydedildi.");
          setFiles([]);
          setFileError(undefined);
          form.reset();
          const dateInput = form.elements.namedItem("logged_at");
          if (dateInput instanceof HTMLInputElement) {
            dateInput.value = todayISODate();
          }
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          name="logged_at"
          label="Tarih"
          type="date"
          required
          defaultValue={todayISODate()}
        />
        {!lockSite ? (
          <SelectInput
            name="site_id"
            label="Şantiye (isteğe bağlı)"
            options={siteOptions}
            defaultValue={defaultSiteId}
          />
        ) : (
          <input type="hidden" name="site_id" value={defaultSiteId} />
        )}
        {!lockWarehouse ? (
          <SelectInput
            name="warehouse_id"
            label="Depo (isteğe bağlı)"
            options={warehouseOptions}
            defaultValue={defaultWarehouseId}
          />
        ) : (
          <input type="hidden" name="warehouse_id" value={defaultWarehouseId} />
        )}
        <div className="sm:col-span-2">
          <TextArea
            name="note"
            label="Not"
            placeholder="Bugün yapılan işler, gözlemler, notlar…"
          />
        </div>
      </div>

      <FileDropzone
        files={files}
        accept={PROGRESS_IMAGE_ACCEPT}
        error={fileError}
        onChange={(next, err) => {
          setFiles(next);
          setFileError(err);
        }}
      />
      <p className="text-xs text-slate-500">
        Fotoğraf isteğe bağlıdır. Yalnızca jpg, jpeg, png, webp (en fazla 5 adet).
      </p>

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
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
