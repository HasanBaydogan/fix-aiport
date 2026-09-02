import Link from "next/link";
import { createProduct } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { CategorySelect } from "@/components/forms/CategorySelect";
import {
  ActionForm,
  TextArea,
  TextInput,
} from "@/components/forms/ActionForm";
import { LocationPicker } from "@/components/map/LocationPicker";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

export default async function UrunEklePage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris");

  if (session.role === "supplier") {
    redirect("/panel/tedarikci/urunler");
  }

  const isAdmin = session.role === "admin";
  const [{ data: categories }, { data: myProducts }] = await Promise.all([
    session.supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .order("sort_order"),
    session.supabase
      .from("products")
      .select("id, name, status, created_at")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Katalog"
        title="Ürün ekle"
        description={
          isAdmin
            ? "Admin olarak ürün ekleyebilirsiniz. Tedarikçi ürünleri için Tedarikçi paneli kullanın."
            : "Ürün eklenince otomatik yayınlanır. Tedarik kaynağı yazarsanız eşleşen tedarikçi profiline bağlanır."
        }
        actions={
          isAdmin ? (
            <Link
              href="/panel/tedarikci/urunler"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Tedarikçi ürünleri
            </Link>
          ) : null
        }
      />

      <SectionCard
        title="1. Temel bilgiler"
        description="Ürün adı ve segment zorunludur."
      >
        <ActionForm action={createProduct} submitLabel="Yayınla">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label="Ürün adı" required />
            <CategorySelect
              name="category_id"
              label="Segment (ana › alt)"
              required
              categories={categories ?? []}
            />
            <TextInput
              name="weight_kg"
              label="Ağırlık (kg)"
              type="number"
              step="0.001"
            />
            <TextInput
              name="sourced_from_text"
              label="Nereden tedarik edildi"
              placeholder="Tedarikçi unvanı (eşleşme için)"
            />
            <TextInput
              name="length_cm"
              label="Uzunluk (cm)"
              type="number"
              step="0.1"
            />
            <TextInput
              name="width_cm"
              label="Genişlik (cm)"
              type="number"
              step="0.1"
            />
            <TextInput
              name="height_cm"
              label="Yükseklik (cm)"
              type="number"
              step="0.1"
            />
            <TextInput
              name="price"
              label="Fiyat (TRY) — giriş sonrası görünür"
              type="number"
              step="0.01"
            />
            <TextInput
              name="location_label"
              label="Konum etiketi"
              placeholder="Mağaza / depo adı"
            />
          </div>
          <TextArea name="description" label="Açıklama" />

          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 text-sm text-brand-900">
            <input
              type="checkbox"
              name="embedded_in_supplier"
              className="mt-1"
            />
            <span>
              Tedarikçi kataloğuna göm (haritada ürün pini gösterme). Tedarikçi
              unvanı eşleşirse ürün firma profilinde listelenir; ayrı ürün pini
              oluşturulmaz.
            </span>
          </label>

          <details className="mt-4 rounded-2xl border border-brand-100 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand-900">
              2. Tedarik konumu (isteğe bağlı)
            </summary>
            <p className="mt-2 text-xs text-slate-500">
              Gömme seçiliyse konum pini oluşturulmaz. Aksi halde ürün haritada
              ürün pini olarak görünür.
            </p>
            <div className="mt-4">
              <LocationPicker optional />
            </div>
          </details>
        </ActionForm>
      </SectionCard>

      <div>
        <h3 className="font-semibold text-brand-900">Gönderdiklerim</h3>
        {(myProducts ?? []).length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="Henüz ürün göndermediniz"
              description="Formu doldurup yayınlayın. Yayınlandığında katalogda listelenir."
            />
          </div>
        ) : (
          <ul className={`${listPanelClass} mt-3`}>
            {(myProducts ?? []).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <Link
                  href={`/urunler/${p.id}`}
                  className="font-medium text-brand-900 hover:underline"
                >
                  {p.name}
                </Link>
                <Badge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
