import type { SupabaseClient } from "@supabase/supabase-js";
import { getFileExtension, MAX_FILE_BYTES, MAX_FILE_COUNT } from "@/lib/form";
import { createSignedUrls, PROGRESS_BUCKET } from "@/lib/storage/site-progress";

export { PROGRESS_BUCKET, PROGRESS_BUCKET as INVOICE_BUCKET };

export const INVOICE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"] as const;
export const INVOICE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export type InvoiceUploadResult = {
  storage_path: string;
  file_name: string;
  content_type: string;
  byte_size: number;
};

function isInvoiceFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  return (INVOICE_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateInvoiceFiles(
  files: File[],
  existingCount = 0,
): string | null {
  if (existingCount + files.length > MAX_FILE_COUNT) {
    return `En fazla ${MAX_FILE_COUNT} fatura dosyası ekleyebilirsiniz.`;
  }
  for (const file of files) {
    if (!isInvoiceFile(file)) {
      return `"${file.name}" desteklenmiyor. İzin verilenler: ${INVOICE_EXTENSIONS.join(", ")}.`;
    }
    if (file.size > MAX_FILE_BYTES) {
      return `"${file.name}" 5 MB sınırını aşıyor.`;
    }
  }
  return null;
}

export function purchaseInvoicePath(
  userId: string,
  purchaseId: string,
  fileName: string,
): string {
  const ext = getFileExtension(fileName) || "pdf";
  const id = crypto.randomUUID();
  return `${userId}/purchase-invoices/${purchaseId}/${id}.${ext}`;
}

export async function uploadPurchaseInvoices(
  supabase: SupabaseClient,
  userId: string,
  purchaseId: string,
  files: File[],
): Promise<{ uploads: InvoiceUploadResult[]; error?: string }> {
  const uploads: InvoiceUploadResult[] = [];

  for (const file of files) {
    const path = purchaseInvoicePath(userId, purchaseId, file.name);
    const ext = getFileExtension(file.name) || "pdf";
    const { error } = await supabase.storage.from(PROGRESS_BUCKET).upload(path, file, {
      contentType: file.type || (ext === "pdf" ? "application/pdf" : `image/${ext}`),
      upsert: false,
    });

    if (error) {
      if (uploads.length > 0) {
        await supabase.storage
          .from(PROGRESS_BUCKET)
          .remove(uploads.map((u) => u.storage_path));
      }
      return { uploads: [], error: error.message };
    }

    uploads.push({
      storage_path: path,
      file_name: file.name,
      content_type: file.type || (ext === "pdf" ? "application/pdf" : `image/${ext}`),
      byte_size: file.size,
    });
  }

  return { uploads };
}

export { createSignedUrls as createInvoiceSignedUrls };
