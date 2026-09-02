"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/lib/actions";
import { SelectInput, TextArea, TextInput } from "@/components/forms/ActionForm";
import { FileDropzone } from "@/components/forms/fields/FileDropzone";
import { LocationPicker } from "@/components/map/LocationPicker";
import { PurchasePriceFields } from "@/components/panel/PurchasePriceFields";
import { INVOICE_ACCEPT, validateInvoiceFiles } from "@/lib/storage/purchase-invoices";

type SiteOption = { id: string; name: string };

export function PurchaseCreateForm({
  sites,
  defaultSiteId,
  today,
}: {
  sites: SiteOption[];
  defaultSiteId?: string;
  today: string;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const validation = validateInvoiceFiles(files);
        if (validation) {
          setFileError(validation);
          return;
        }
        const formData = new FormData(e.currentTarget);
        for (const file of files) {
          formData.append("invoices", file);
        }
        startTransition(async () => {
          const result = await createPurchase(formData);
          if (result.error) setError(result.error);
          else {
            setFiles([]);
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          name="site_id"
          label="Şantiye"
          required
          defaultValue={defaultSiteId}
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
        />
        <TextInput name="product_name" label="Ürün" required />
        <TextInput name="qty" label="Miktar" required type="number" step="0.001" />
        <TextInput name="unit" label="Birim" defaultValue="adet" />
        <PurchasePriceFields />
        <TextInput name="purchased_at" label="Tarih" type="date" defaultValue={today} />
        <TextInput name="supplier_ref" label="Tedarikçi / satıcı adı" />
        <TextInput
          name="purchase_location_label"
          label="Konum etiketi"
          placeholder="Örn. Depo girişi, mağaza adı"
        />
      </div>
      <TextArea name="notes" label="Not" />
      <div>
        <p className="mb-2 text-sm font-semibold text-brand-900">Fatura (opsiyonel)</p>
        <FileDropzone
          files={files}
          accept={INVOICE_ACCEPT}
          onChange={(next, err) => {
            setFiles(next);
            setFileError(err);
          }}
        />
        {fileError ? <p className="mt-1 text-xs text-red-600">{fileError}</p> : null}
      </div>
      <details className="rounded-2xl border border-brand-100 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-900">
          Nereden aldınız? (isteğe bağlı harita)
        </summary>
        <div className="mt-4">
          <LocationPicker optional />
        </div>
      </details>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" disabled={pending} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {pending ? "Kaydediliyor…" : "Satın alma ekle"}
      </button>
    </form>
  );
}
