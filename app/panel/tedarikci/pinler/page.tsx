import Link from "next/link";
import { createSupplierLocation } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { ActionForm, TextInput } from "@/components/forms/ActionForm";
import { GlobalMap } from "@/components/map/GlobalMap";
import type { GlobalMapPin } from "@/components/map/GlobalMapInner";
import { LocationPicker } from "@/components/map/LocationPicker";
import { DeleteSupplierLocationButton } from "@/components/panel/DeleteSupplierLocationButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

export default async function TedarikciPinlerPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/tedarikci/pinler");

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select("id, status, org_name, kvkk_consent_at")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/panel/tedarikci/profil");
  }

  const { data: locations } = await session.supabase
    .from("supplier_locations")
    .select("*")
    .eq("supplier_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const previewPins: GlobalMapPin[] = (locations ?? []).map((loc) => ({
    id: loc.id,
    lat: loc.lat,
    lng: loc.lng,
    kind: "supplier" as const,
    title: profile.org_name,
    subtitle: loc.label || loc.status,
    linkHref: `/tedarikci/${profile.id}`,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Tedarikçi"
        title="Harita pinleri"
        description="Depo veya şube konumlarınız. Firma ürünleri bu pinlerle temsil edilir."
      />

      {profile.status !== "published" || !profile.kvkk_consent_at ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Profil onaylı ve KVKK onayı olmadan pinleriniz haritada yayınlanmaz.{" "}
          <Link href="/panel/tedarikci/profil" className="font-semibold underline">
            Profili kontrol et
          </Link>
        </p>
      ) : null}

      <SectionCard title="Pin ekle" description="Haritadan konum seçin.">
        <ActionForm action={createSupplierLocation} submitLabel="Pin ekle">
          <TextInput name="label" label="Etiket" placeholder="Depo / şube adı" />
          <LocationPicker />
        </ActionForm>
      </SectionCard>

      {(locations ?? []).length === 0 ? (
        <EmptyState
          title="Henüz pin yok"
          description="Yukarıdaki formu kullanarak ilk depo veya şube konumunuzu ekleyin."
        />
      ) : (
        <>
          <SectionCard title="Pin önizleme">
            <GlobalMap pins={previewPins} isLoggedIn />
          </SectionCard>

          <ul className={listPanelClass}>
            {(locations ?? []).map((loc) => (
              <li
                key={loc.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-brand-900">
                    {loc.label || "Pin"}
                  </p>
                  <p className="text-slate-500">
                    {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={loc.status} />
                  <DeleteSupplierLocationButton locationId={loc.id} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
