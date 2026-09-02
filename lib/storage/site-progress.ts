import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  getFileExtension,
} from "@/lib/form";

export const PROGRESS_BUCKET = "private-attachments";
export const PROGRESS_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const PROGRESS_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const PROGRESS_SIGNED_URL_TTL_SEC = 60 * 60; // 1 hour

export type ProgressUploadResult = {
  storage_path: string;
  sort_order: number;
};

function isProgressImage(file: File): boolean {
  const ext = getFileExtension(file.name);
  return (PROGRESS_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateProgressFiles(files: File[]): string | null {
  if (files.length > MAX_FILE_COUNT) {
    return `En fazla ${MAX_FILE_COUNT} fotoğraf ekleyebilirsiniz.`;
  }
  for (const file of files) {
    if (!isProgressImage(file)) {
      return `"${file.name}" desteklenmiyor. Yalnızca jpg, jpeg, png, webp.`;
    }
    if (file.size > MAX_FILE_BYTES) {
      return `"${file.name}" 5 MB sınırını aşıyor.`;
    }
  }
  return null;
}

export function dailyLogPhotoPath(
  userId: string,
  entryId: string,
  fileName: string,
): string {
  const ext = getFileExtension(fileName) || "jpg";
  const id = crypto.randomUUID();
  return `${userId}/daily-logs/${entryId}/${id}.${ext}`;
}

/** @deprecated Use dailyLogPhotoPath */
export function progressPhotoPath(
  userId: string,
  _siteId: string,
  entryId: string,
  fileName: string,
): string {
  return dailyLogPhotoPath(userId, entryId, fileName);
}

export async function uploadDailyLogPhotos(
  supabase: SupabaseClient,
  userId: string,
  entryId: string,
  files: File[],
): Promise<{ uploads: ProgressUploadResult[]; error?: string }> {
  const uploads: ProgressUploadResult[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const path = dailyLogPhotoPath(userId, entryId, file.name);
    const { error } = await supabase.storage
      .from(PROGRESS_BUCKET)
      .upload(path, file, {
        contentType: file.type || `image/${getFileExtension(file.name) || "jpeg"}`,
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

    uploads.push({ storage_path: path, sort_order: i });
  }

  return { uploads };
}

/** @deprecated Use uploadDailyLogPhotos */
export async function uploadProgressPhotos(
  supabase: SupabaseClient,
  userId: string,
  _siteId: string,
  entryId: string,
  files: File[],
): Promise<{ uploads: ProgressUploadResult[]; error?: string }> {
  return uploadDailyLogPhotos(supabase, userId, entryId, files);
}

export async function createSignedUrls(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(PROGRESS_BUCKET)
    .createSignedUrls(paths, PROGRESS_SIGNED_URL_TTL_SEC);

  if (error || !data) return map;

  for (const item of data) {
    if (item.path && item.signedUrl) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}
