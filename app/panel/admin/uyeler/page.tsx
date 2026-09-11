import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, roleLabel } from "@/lib/auth/roles";
import { listAdminMembers } from "@/lib/admin/users";
import { AdminRoleForm } from "@/components/panel/AdminRoleForm";
import { ServiceRoleBanner } from "@/components/panel/ServiceRoleBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { listPanelClass } from "@/lib/ui/classes";
import type { AppRole } from "@/lib/supabase/database.types";

export default async function AdminUyelerPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/panel");

  const params = await searchParams;
  const raw = params.rol;
  const roleFilter: AppRole | "all" =
    raw === "buyer" || raw === "supplier" || raw === "admin" ? raw : "all";

  const { members, error } = await listAdminMembers(roleFilter);

  const filters: Array<{ key: AppRole | "all"; label: string }> = [
    { key: "all", label: "Tümü" },
    { key: "buyer", label: "Alıcılar" },
    { key: "supplier", label: "Tedarikçiler" },
    { key: "admin", label: "Adminler" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Admin"
        title="Üyeler"
        description="Tüm kayıtlı kullanıcılar ve platform rolleri (buyer / supplier / admin)."
        actions={
          <Link
            href="/panel/admin/tedarikciler"
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Tedarikçi ekle
          </Link>
        }
      />

      <ServiceRoleBanner />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = roleFilter === f.key;
          const href =
            f.key === "all"
              ? "/panel/admin/uyeler"
              : `/panel/admin/uyeler?rol=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "bg-brand-600 text-white"
                  : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul className={listPanelClass}>
        {(members ?? []).length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">
            Üye bulunamadı.
          </li>
        ) : (
          (members ?? []).map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-brand-900">
                  {m.display_name || "İsimsiz"}
                  <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    {roleLabel(m.role)}
                  </span>
                </p>
                <p className="truncate text-sm text-slate-500">
                  {m.email || "E-posta yok"}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(m.created_at).toLocaleDateString("tr-TR")}
                  {m.supplier_profile_id ? (
                    <>
                      {" · "}
                      <Link
                        href={`/panel/admin/tedarikciler/${m.supplier_profile_id}`}
                        className="font-medium text-brand-700 underline"
                      >
                        {m.supplier_org_name || "Firma"}
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              {m.role === "admin" && m.id === session.user.id ? (
                <p className="text-xs text-slate-500">Sizin hesabınız</p>
              ) : m.role === "supplier" ? (
                <p className="max-w-[14rem] text-xs text-slate-500">
                  Tedarikçi rolü sabittir.{" "}
                  {m.supplier_profile_id ? (
                    <Link
                      href={`/panel/admin/tedarikciler/${m.supplier_profile_id}`}
                      className="font-medium text-brand-700 underline"
                    >
                      Firmayı yönet
                    </Link>
                  ) : (
                    "Firma Tedarikçiler sayfasından yönetilir."
                  )}
                </p>
              ) : (
                <AdminRoleForm userId={m.id} currentRole={m.role} />
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
