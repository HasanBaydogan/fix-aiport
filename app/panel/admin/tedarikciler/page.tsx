import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { getEmailsByUserIds, listBuyerCandidates } from "@/lib/admin/users";
import { AdminCreateSupplierForm } from "@/components/panel/AdminCreateSupplierForm";
import { ServiceRoleBanner } from "@/components/panel/ServiceRoleBanner";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";

export default async function AdminTedarikcilerPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/panel");

  const { data: profiles } = await session.supabase
    .from("supplier_profiles")
    .select(
      "id, org_name, city, status, user_id, created_at, kvkk_consent_at, profiles:user_id(display_name)",
    )
    .order("created_at", { ascending: false });

  const ownerIds = (profiles ?? []).map((p) => p.user_id);
  const [emailById, buyersResult] = await Promise.all([
    isServiceRoleConfigured()
      ? getEmailsByUserIds(ownerIds)
      : Promise.resolve(new Map<string, string | null>()),
    listBuyerCandidates(),
  ]);

  const buyers = buyersResult.buyers ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Admin"
        title="Tedarikçiler"
        description="Firma oluşturun, sahip atayın veya e-posta ile davet edin. Tedarikçi yalnızca buradan eklenir (R2)."
        actions={
          <Link
            href="/panel/admin/uyeler"
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Üyeler
          </Link>
        }
      />

      <ServiceRoleBanner />

      <SectionCard
        title="Yeni tedarikçi"
        description="Firma profili pending oluşur; sahip KVKK onayını tamamladıktan sonra moderasyondan yayınlanır."
      >
        <AdminCreateSupplierForm buyers={buyers} />
      </SectionCard>

      <section className="space-y-3">
        <h3 className="font-semibold text-brand-900">
          Firmalar
          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {(profiles ?? []).length}
          </span>
        </h3>
        <ul className={listPanelClass}>
          {(profiles ?? []).length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Henüz tedarikçi yok.
            </li>
          ) : (
            (profiles ?? []).map((p) => {
              const profileJoin = p.profiles as
                | { display_name: string | null }
                | { display_name: string | null }[]
                | null;
              const displayName = Array.isArray(profileJoin)
                ? profileJoin[0]?.display_name
                : profileJoin?.display_name;

              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/panel/admin/tedarikciler/${p.id}`}
                      className="font-medium text-brand-900 hover:underline"
                    >
                      {p.org_name}
                    </Link>
                    <p className="text-slate-500">
                      {displayName || "Sahip"}
                      {emailById.get(p.user_id)
                        ? ` · ${emailById.get(p.user_id)}`
                        : ""}
                      {p.city ? ` · ${p.city}` : ""}
                      {!p.kvkk_consent_at ? " · KVKK bekleniyor" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={p.status} />
                    <Link
                      href={`/panel/admin/tedarikciler/${p.id}`}
                      className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                    >
                      Detay
                    </Link>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
