export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_COUNT = 5;

export const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
  "txt",
] as const;

export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(",");

export function getSubmitKitEndpoint(formIdOrUrl: string): string {
  if (formIdOrUrl.startsWith("http://") || formIdOrUrl.startsWith("https://")) {
    return formIdOrUrl;
  }
  return `https://submitkit.dev/api/f/${formIdOrUrl}`;
}

export type FormValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  message: string;
};

export type FormErrors = Partial<Record<keyof FormValues | "files", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

export function isAllowedFile(file: File): boolean {
  return ALLOWED_EXTENSIONS.includes(
    getFileExtension(file.name) as (typeof ALLOWED_EXTENSIONS)[number],
  );
}

export function getTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

export function validateValues(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Ad soyad zorunludur.";
  }

  const digits = values.phone.replace(/\D/g, "");
  if (!values.phone.trim()) {
    errors.phone = "Telefon zorunludur.";
  } else if (digits.length < 10) {
    errors.phone = "Geçerli bir telefon numarası girin.";
  }

  if (!values.email.trim()) {
    errors.email = "E-posta zorunludur.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }

  if (!values.address.trim()) {
    errors.address = "Adres zorunludur.";
  }

  if (!values.message.trim()) {
    errors.message = "Açıklama zorunludur.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Açıklama en az 10 karakter olmalıdır.";
  }

  return errors;
}

export function mergeFiles(current: File[], incoming: File[]): {
  files: File[];
  error?: string;
} {
  const unique = [...current];

  for (const file of incoming) {
    const exists = unique.some(
      (item) =>
        item.name === file.name &&
        item.size === file.size &&
        item.lastModified === file.lastModified,
    );

    if (!exists) {
      unique.push(file);
    }
  }

  if (unique.length > MAX_FILE_COUNT) {
    return {
      files: current,
      error: `En fazla ${MAX_FILE_COUNT} dosya yükleyebilirsiniz.`,
    };
  }

  const invalid = unique.find((file) => !isAllowedFile(file));
  if (invalid) {
    return {
      files: current,
      error: `"${invalid.name}" desteklenmeyen bir dosya türü. İzin verilenler: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }

  const oversized = unique.find((file) => file.size > MAX_FILE_BYTES);
  if (oversized) {
    return {
      files: current,
      error: `"${oversized.name}" 5 MB sınırını aşıyor. Her dosya en fazla 5 MB olabilir.`,
    };
  }

  return { files: unique };
}
