import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { ModerateButtons } from "@/components/panel/ModerateButtons";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export default async function AdminTedarikciDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/panel");

  const { id } = await params;

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select(
      "id, org_name, city, district, public_phone, website, category_focus, status, moderation_note, kvkk_consent_at, user_id, created_at, updated_at, profiles:user_id(display_name, role)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  let email: string | null = null;
  if (isServiceRoleConfigured()) {
    const admin = createServiceClient();
    const { data } = await admin.auth.admin.getUserById(profile.user_id);
    email = data.user?.email ?? null;
  }

  const profileJoin = profile.profiles as
    | { display_name: string | null; role: string }
    | { display_name: string | null; role: string }[]
    | null;
  const owner = Array.isArray(profileJoin) ? profileJoin[0] : profileJoin;

  const [{ count: productCount }, { count: pinCount }] = await Promise.all([
    session.supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("supplier_profile_id", profile.id),
    session.supabase
      .from("supplier_locations")
      .select("*", { count: "exact", head: true })
      .eq("supplier_profile_id", profile.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Admin"
        title={profile.org_name}
        description="Tedarikçi firma detayı ve moderasyon."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge status={profile.status} />
            <Link
              href="/panel/admin/tedarikciler"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Listeye dön
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Firma bilgileri">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Şehir</dt>
              <dd className="font-medium text-brand-900">
                {[profile.city, profile.district].filter(Boolean).join(" / ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Telefon</dt>
              <dd className="font-medium text-brand-900">
                {profile.public_phone || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Web</dt>
              <dd className="font-medium text-brand-900">{profile.website || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Kategori</dt>
              <dd className="font-medium text-brand-900">
                {profile.category_focus || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">KVKK</dt>
              <dd className="font-medium text-brand-900">
                {profile.kvkk_consent_at
                  ? new Date(profile.kvkk_consent_at).toLocaleString("tr-TR")
                  : "Bekleniyor"}
              </dd>
            </div>
            {profile.moderation_note ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                Moderasyon notu: {profile.moderation_note}
              </div>
            ) : null}
          </dl>
        </SectionCard>

        <SectionCard title="Sahip">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ad</dt>
              <dd className="font-medium text-brand-900">
                {owner?.display_name || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">E-posta</dt>
              <dd className="font-medium text-brand-900">{email || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-medium text-brand-900">{owner?.role || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ürün / pin</dt>
              <dd className="font-medium text-brand-900">
                {productCount ?? 0} / {pinCount ?? 0}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.status === "published" ? (
              <Link
                href={`/tedarikci/${profile.id}`}
                className="rounded-xl border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
              >
                Public profil
              </Link>
            ) : null}
            <Link
              href={`/panel/admin/uyeler?rol=supplier`}
              className="rounded-xl border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
            >
              Üye listesi
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Moderasyon"
        description="Yayınlamak için KVKK onayı tamamlanmış olmalıdır (R4)."
      >
        {!profile.kvkk_consent_at ? (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Sahip henüz KVKK onayını vermedi. Yine de durum güncelleyebilirsiniz; haritada
            görünürlük consent olmadan açılmaz.
          </p>
        ) : null}
        <ModerateButtons table="supplier_profiles" id={profile.id} />
      </SectionCard>
    </div>
  );
}
