import Link from "next/link";
import { upsertSupplierProfile } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { ActionForm, TextInput } from "@/components/forms/ActionForm";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default async function TedarikciProfilPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/tedarikci/profil");

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Tedarikçi"
        title="Firma profili"
        description="KVKK whitelist alanları (R4). Consent olmadan haritada görünmezsiniz."
        actions={
          profile ? (
            <div className="flex items-center gap-3">
              <Badge status={profile.status} />
              {profile.status === "published" ? (
                <Link
                  href={`/tedarikci/${profile.id}`}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
                >
                  Public profili gör
                </Link>
              ) : null}
            </div>
          ) : null
        }
      />

      {profile?.status === "pending" ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Profiliniz admin onayı bekliyor. Onaylandıktan sonra yeni ürün ve pinler
          otomatik yayınlanır.
        </p>
      ) : null}

      {profile?.status === "rejected" ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Profil reddedildi
          {profile.moderation_note ? `: ${profile.moderation_note}` : "."} Bilgileri
          güncelleyip yeniden gönderin.
        </p>
      ) : null}

      <SectionCard title="Profil bilgileri">
        <ActionForm
          action={upsertSupplierProfile}
          submitLabel={
            profile?.status === "published"
              ? "Profili güncelle"
              : "Profili kaydet / onaya gönder"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              name="org_name"
              label="Ticari unvan"
              required
              defaultValue={profile?.org_name}
            />
            <TextInput name="city" label="Şehir" defaultValue={profile?.city ?? ""} />
            <TextInput
              name="district"
              label="İlçe"
              defaultValue={profile?.district ?? ""}
            />
            <TextInput
              name="public_phone"
              label="İş telefonu (public)"
              defaultValue={profile?.public_phone ?? ""}
            />
            <TextInput
              name="website"
              label="Web sitesi"
              defaultValue={profile?.website ?? ""}
            />
            <TextInput
              name="category_focus"
              label="Odak kategori"
              defaultValue={profile?.category_focus ?? ""}
            />
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 text-sm text-brand-900">
            <input
              type="checkbox"
              name="kvkk_consent"
              className="mt-1"
              defaultChecked={Boolean(profile?.kvkk_consent_at)}
            />
            <span>
              Public profil ve harita pinimin KVKK uygun alanlarla yayınlanmasını
              onaylıyorum. Bu onay olmadan haritada görünmezsiniz.
            </span>
          </label>
        </ActionForm>
      </SectionCard>
    </div>
  );
}
