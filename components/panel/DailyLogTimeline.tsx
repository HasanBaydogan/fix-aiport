"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageLightbox } from "@/components/panel/ImageLightbox";
import { archiveSiteProgressEntry } from "@/lib/actions";
import type { SiteProgressEntry } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/ui/EmptyState";

function formatLoggedAt(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(entries: SiteProgressEntry[]) {
  const groups = new Map<string, SiteProgressEntry[]>();
  for (const entry of entries) {
    const key = entry.logged_at;
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

function TagBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
      <span className="text-brand-500">{label}:</span>
      {value}
    </span>
  );
}

export function DailyLogTimeline({
  entries,
  showTags = true,
}: {
  entries: SiteProgressEntry[];
  showTags?: boolean;
}) {
  const router = useRouter();
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(() => groupByDate(entries), [entries]);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Henüz günlük kaydı yok"
        description="Bugün yapılan işleri not alarak veya fotoğraf ekleyerek başlayın."
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {grouped.map(([date, dayEntries]) => (
          <section key={date}>
            <h3 className="mb-3 border-b border-brand-100 pb-2 text-sm font-semibold text-brand-700">
              {formatLoggedAt(date)}
            </h3>
            <ul className="space-y-3">
              {dayEntries.map((entry) => {
                const photos = [...(entry.site_progress_photos ?? [])].sort(
                  (a, b) => a.sort_order - b.sort_order,
                );
                const siteName = entry.sites?.name;
                const warehouseName = entry.warehouses?.name;

                return (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-brand-100 bg-white p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-2">
                        {showTags && (siteName || warehouseName) ? (
                          <div className="flex flex-wrap gap-1.5">
                            {siteName ? (
                              <TagBadge label="Şantiye" value={siteName} />
                            ) : null}
                            {warehouseName ? (
                              <TagBadge label="Depo" value={warehouseName} />
                            ) : null}
                          </div>
                        ) : null}
                        {entry.note ? (
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {entry.note}
                          </p>
                        ) : null}
                        <p className="text-xs text-slate-400">
                          {formatTime(entry.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={pending && pendingId === entry.id}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                        onClick={() => {
                          if (
                            !window.confirm(
                              "Bu günlük kaydını arşivlemek istiyor musunuz?",
                            )
                          ) {
                            return;
                          }
                          setPendingId(entry.id);
                          startTransition(async () => {
                            await archiveSiteProgressEntry(entry.id);
                            setPendingId(null);
                            router.refresh();
                          });
                        }}
                      >
                        {pending && pendingId === entry.id ? "…" : "Arşivle"}
                      </button>
                    </div>
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {photos.map((photo, index) => {
                          const src = photo.url;
                          if (!src) return null;
                          const alt = `${formatLoggedAt(entry.logged_at)} — fotoğraf ${index + 1}`;
                          return (
                            <button
                              key={photo.id}
                              type="button"
                              className="aspect-square overflow-hidden rounded-xl border border-brand-100 bg-brand-50"
                              onClick={() => setLightbox({ src, alt })}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={alt}
                                className="h-full w-full object-cover transition hover:opacity-90"
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      {lightbox ? (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </>
  );
}
