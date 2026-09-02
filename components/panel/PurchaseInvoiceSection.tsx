"use client";

import { useEffect, useState, useTransition } from "react";
import {
  deletePurchaseAttachment,
  getPurchaseAttachments,
  uploadPurchaseAttachments,
} from "@/lib/actions";
import { FileDropzone } from "@/components/forms/fields/FileDropzone";
import { buttonPrimaryClass } from "@/lib/forms/types";
import { INVOICE_ACCEPT, validateInvoiceFiles } from "@/lib/storage/purchase-invoices";
import type { Purchase } from "@/lib/supabase/database.types";

export function PurchaseInvoiceSection({ row }: { row: Purchase }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<
    Array<{
      id: string;
      file_name: string;
      url?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    startTransition(async () => {
      const result = await getPurchaseAttachments(row.id);
      if (result.error) setError(result.error);
      else setAttachments(result.attachments);
      setLoading(false);
    });
  }, [open, row.id]);

  if (!open) {
    return (
      <button
        type="button"
        className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
        onClick={() => setOpen(true)}
      >
        Faturalar
      </button>
    );
  }

  return (
    <div className="mt-2 w-full space-y-3 rounded-xl border border-brand-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-brand-900">Fatura / ekler</p>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-slate-700"
          onClick={() => setOpen(false)}
        >
          Kapat
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Yükleniyor…</p>
      ) : attachments.length > 0 ? (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-brand-600 hover:underline"
                >
                  {a.file_name}
                </a>
              ) : (
                <span className="truncate text-slate-600">{a.file_name}</span>
              )}
              <button
                type="button"
                className="shrink-0 text-xs text-red-600 hover:underline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await deletePurchaseAttachment(a.id);
                    if (result.error) setError(result.error);
                    else {
                      const refreshed = await getPurchaseAttachments(row.id);
                      setAttachments(refreshed.attachments);
                    }
                  })
                }
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Henüz fatura eklenmedi.</p>
      )}

      <form
        className="space-y-2 border-t border-brand-100 pt-3"
        action={(formData) => {
          setError(null);
          formData.set("purchase_id", row.id);
          formData.set("site_id", row.site_id);
          for (const file of files) {
            formData.append("invoices", file);
          }
          startTransition(async () => {
            const result = await uploadPurchaseAttachments(formData);
            if (result.error) setError(result.error);
            else {
              setFiles([]);
              const refreshed = await getPurchaseAttachments(row.id);
              setAttachments(refreshed.attachments);
            }
          });
        }}
      >
        <FileDropzone
          files={files}
          accept={INVOICE_ACCEPT}
          onChange={(next, err) => {
            setFiles(next);
            setFileError(err);
          }}
        />
        {(fileError || error) && (
          <p className="text-xs text-red-600">{fileError ?? error}</p>
        )}
        <button
          type="submit"
          disabled={pending || files.length === 0}
          className={buttonPrimaryClass}
          onClick={(e) => {
            const validation = validateInvoiceFiles(files, attachments.length);
            if (validation) {
              e.preventDefault();
              setFileError(validation);
            }
          }}
        >
          {pending ? "…" : "Fatura yükle"}
        </button>
      </form>
    </div>
  );
}
