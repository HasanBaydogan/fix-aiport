"use client";

import { useMemo, useRef, useState } from "react";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_EXTENSIONS,
  MAX_FILE_COUNT,
  formatFileSize,
  getTotalSize,
  mergeFiles,
} from "@/lib/form";

export function FileDropzone({
  files,
  onChange,
  error,
  accept = ACCEPT_ATTRIBUTE,
  maxCount = MAX_FILE_COUNT,
}: {
  files: File[];
  onChange: (files: File[], error?: string) => void;
  error?: string;
  accept?: string;
  maxCount?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const totalSize = useMemo(() => getTotalSize(files), [files]);

  function addFiles(incoming: File[]) {
    const result = mergeFiles(files, incoming);
    onChange(result.files, result.error);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="text-sm font-semibold text-brand-900">Ekler</span>
        <span className="text-xs text-slate-500">
          {files.length}/{maxCount} dosya · {formatFileSize(totalSize)} · max 5 MB/dosya
        </span>
      </div>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragActive
            ? "border-brand-600 bg-brand-50"
            : error
              ? "border-red-400 bg-red-50"
              : "border-brand-200 bg-brand-50/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <p className="text-sm font-medium text-brand-900">
          Dosyaları sürükleyip bırakın veya{" "}
          <button
            type="button"
            className="text-brand-600 underline-offset-2 hover:underline"
            onClick={() => fileInputRef.current?.click()}
          >
            bilgisayardan seçin
          </button>
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Desteklenen: {ALLOWED_EXTENSIONS.join(", ")}.
        </p>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-900">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={() => removeFile(index)}
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
