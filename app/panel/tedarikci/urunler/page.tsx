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
import { DeleteSupplierProductButton } from "@/components/panel/DeleteSupplierProductButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { listPanelClass } from "@/lib/ui/classes";

export default async function TedarikciUrunlerPage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/tedarikci/urunler");

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select("id, status, org_name, kvkk_consent_at")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/panel/tedarikci/profil");
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    session.supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .order("sort_order"),
    session.supabase
      .from("products")
      .select("id, name, status, created_at, categories(name)")
      .eq("supplier_profile_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Tedarikçi"
        title="Firma ürünleri"
        description="Ürünler firmanıza bağlanır. Haritada ayrı ürün pini oluşturulmaz; yalnızca firma pinleriniz görünür."
      />

      {profile.status !== "published" ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Profiliniz henüz onaylanmadı. Eklediğiniz ürünler profil onaylanınca
          otomatik yayınlanır.
        </p>
      ) : null}

      <SectionCard
        title="Ürün ekle"
        description="Segment seçin. Konum için Harita pinleri sayfasını kullanın."
      >
        <ActionForm action={createProduct} submitLabel="Ürün ekle">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label="Ürün adı" required />
            <CategorySelect
              name="category_id"
              label="Segment"
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
              name="price"
              label="Fiyat (TRY)"
              type="number"
              step="0.01"
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
          </div>
          <TextArea name="description" label="Açıklama" />
        </ActionForm>
      </SectionCard>

      {(products ?? []).length === 0 ? (
        <EmptyState
          title="Henüz ürün yok"
          description="Yukarıdaki formu kullanarak firmanıza ilk ürünü ekleyin."
        />
      ) : (
        <ul className={listPanelClass}>
          {(products ?? []).map((p) => {
            const cat = p.categories as
              | { name: string }
              | { name: string }[]
              | null;
            const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <Link
                    href={`/panel/tedarikci/urunler/${p.id}`}
                    className="font-medium text-brand-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-slate-500">
                    {catName ?? "Segment yok"} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={p.status} />
                  <Link
                    href={`/panel/tedarikci/urunler/${p.id}`}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    Düzenle
                  </Link>
                  <DeleteSupplierProductButton productId={p.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
