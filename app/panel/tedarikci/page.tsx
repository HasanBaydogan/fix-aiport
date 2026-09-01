import Link from "next/link";
import {
  createSupplierLocation,
  upsertSupplierProfile,
} from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  ActionForm,
  TextInput,
} from "@/components/forms/ActionForm";
import { LocationPicker } from "@/components/map/LocationPicker";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

export default async function TedarikciPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris");
  if (session.role !== "supplier" && session.role !== "admin") {
    redirect("/panel");
  }

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { data: locations } = profile
    ? await session.supabase
        .from("supplier_locations")
        .select("*")
        .eq("supplier_profile_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Tedarikçi"
        title="Tedarikçi public profil"
        description="KVKK whitelist alanları (R4). Consent olmadan haritada görünmez. Admin onayı gerekir (R3)."
        actions={
          profile?.status === "published" ? (
            <Link
              href={`/tedarikci/${profile.id}`}
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Public profili gör
            </Link>
          ) : null
        }
      />

      <SectionCard title="Profil bilgileri">
        <ActionForm action={upsertSupplierProfile} submitLabel="Profili kaydet / onaya gönder">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              name="org_name"
              label="Ticari unvan"
              required
              defaultValue={profile?.org_name}
            />
            <TextInput name="city" label="Şehir" defaultValue={profile?.city ?? ""} />
            <TextInput name="district" label="İlçe" defaultValue={profile?.district ?? ""} />
            <TextInput
              name="public_phone"
              label="İş telefonu (public)"
              defaultValue={profile?.public_phone ?? ""}
            />
            <TextInput name="website" label="Web sitesi" defaultValue={profile?.website ?? ""} />
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
              Public profil ve harita pinimin KVKK uygun alanlarla yayınlanmasını onaylıyorum.
              Bu onay olmadan haritada görünmezsiniz.
            </span>
          </label>
        </ActionForm>
      </SectionCard>

      <SectionCard title="Harita pini ekle" description="Depo veya şube konumunuzu işaretleyin.">
        <ActionForm action={createSupplierLocation} submitLabel="Pin gönder">
          <TextInput name="label" label="Etiket" placeholder="Depo / şube adı" />
          <LocationPicker />
        </ActionForm>
      </SectionCard>

      {(locations ?? []).length > 0 ? (
        <ul className={listPanelClass}>
          {(locations ?? []).map((loc) => (
            <li key={loc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-brand-900">{loc.label || "Pin"}</p>
                <p className="text-slate-500">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </p>
              </div>
              <Badge status={loc.status} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
