import Link from "next/link";
import { createUserProductLocation } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  ActionForm,
  TextArea,
  TextInput,
} from "@/components/forms/ActionForm";
import { LocationPicker } from "@/components/map/LocationPicker";
import { BuyerLocationsMap } from "@/components/map/BuyerLocationsMap";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

export default async function KonumlarPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris");

  const { data: locations } = await session.supabase
    .from("user_product_locations")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const pins = (locations ?? []).map((loc) => ({
    id: loc.id,
    lat: loc.lat,
    lng: loc.lng,
    label: loc.label,
    product_name: loc.product_name,
    notes: loc.notes,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Konum"
        title="Ürün konumlarım"
        description="Nereden malzeme aldığınızı işaretleyin. Admin onayı sonrası global haritada görünür (R3, R6)."
        actions={
          <Link
            href="/harita"
            className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Haritayı gör
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
          Onay bekliyor — henüz public değil
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
          Yayında — haritada görünür
        </span>
      </div>

      {pins.length > 0 ? <BuyerLocationsMap pins={pins} /> : null}

      <SectionCard title="Yeni konum ekle" description="Haritadan pin seçin veya konumunuzu kullanın.">
        <ActionForm action={createUserProductLocation} submitLabel="Konum kaydet">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="product_name" label="Ürün / malzeme" required />
            <TextInput
              name="label"
              label="Yer adı"
              placeholder="Örn. X Yapı Market Kadıköy"
            />
          </div>
          <TextArea name="notes" label="Not" placeholder="Tedarikçi, fiyat, hatırlatma…" />
          <LocationPicker />
        </ActionForm>
      </SectionCard>

      {(locations ?? []).length === 0 ? (
        <EmptyState
          title="Henüz konum yok"
          description="Satın alım eklerken de konum işaretleyebilirsiniz. Onay sonrası /harita sayfasında görünür."
          primaryHref="/panel/satin-alimlar"
          primaryLabel="Satın alım ekle"
        />
      ) : (
        <ul className={listPanelClass}>
          {(locations ?? []).map((loc) => (
            <li key={loc.id} className="px-4 py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-brand-900">{loc.product_name}</p>
                <Badge status={loc.status} />
              </div>
              <p className="mt-1 text-slate-600">
                {loc.label || "Konum"} · {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </p>
              {loc.notes ? <p className="mt-1 text-slate-500">{loc.notes}</p> : null}
              {loc.purchase_id ? (
                <p className="mt-1 text-xs text-brand-600">Satın alımdan eklendi</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
