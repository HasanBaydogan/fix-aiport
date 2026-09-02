import Link from "next/link";
import { createSite } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { ActionForm, TextInput } from "@/components/forms/ActionForm";
import { ArchiveSiteButton } from "@/components/panel/ArchiveSiteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

function formatShortDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

export default async function SantiyelerPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris");
  const { data: sites } = await session.supabase
    .from("sites")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const siteIds = (sites ?? []).map((s) => s.id);
  const lastProgressBySite = new Map<string, string>();

  if (siteIds.length > 0) {
    const { data: progress } = await session.supabase
      .from("site_progress_entries")
      .select("site_id, logged_at")
      .in("site_id", siteIds)
      .is("archived_at", null)
      .order("logged_at", { ascending: false });

    for (const row of progress ?? []) {
      if (row.site_id && !lastProgressBySite.has(row.site_id)) {
        lastProgressBySite.set(row.site_id, row.logged_at);
      }
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Şantiye"
        title="Şantiyelerim"
        description="Private veri — yalnızca size görünür (R7). Soft-delete ile arşivlenir."
      />

      <SectionCard title="Yeni şantiye" description="Proje veya şantiye adını ekleyin.">
        <ActionForm action={createSite} submitLabel="Şantiye ekle">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label="Şantiye adı" required placeholder="Örn. Kadıköy Villa" />
            <TextInput name="address" label="Adres" placeholder="İlçe, il" />
          </div>
        </ActionForm>
      </SectionCard>

      {(sites ?? []).length === 0 ? (
        <EmptyState
          title="Henüz şantiye yok"
          description="Yukarıdaki formu kullanarak ilk şantiyenizi ekleyin ve stok takibine başlayın."
        />
      ) : (
        <ul className={listPanelClass}>
          {(sites ?? []).map((site) => {
            const lastProgress = lastProgressBySite.get(site.id);
            return (
              <li
                key={site.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <Link
                  href={`/panel/santiyeler/${site.id}`}
                  className="flex min-w-0 gap-3 hover:underline"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-700">
                    {site.name.charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <p className="font-medium text-brand-900">{site.name}</p>
                    <p className="text-sm text-slate-500">
                      {site.address || "Adres yok"}
                      {lastProgress
                        ? ` · son günlük: ${formatShortDate(lastProgress)}`
                        : ""}
                    </p>
                  </span>
                </Link>
                <ArchiveSiteButton siteId={site.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
