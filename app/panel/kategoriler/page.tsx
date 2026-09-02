import Link from "next/link";
import { redirect } from "next/navigation";
import { createCategory } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import type { CategoryRow } from "@/lib/categories";
import { flattenCategoryOptions } from "@/lib/categories";
import {
  ActionForm,
  SelectInput,
  TextInput,
} from "@/components/forms/ActionForm";
import { CategoryTreeList } from "@/components/panel/CategoryTreeList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default async function KategorilerPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/panel");

  const { data: categories } = await session.supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order")
    .order("sort_order");

  const rows = (categories ?? []) as CategoryRow[];
  const parentOptions = flattenCategoryOptions(rows);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Admin"
        title="Kategori yönetimi"
        description="Segment ve alt segmentleri ekleyin, düzenleyin veya sıralayın."
        actions={
          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-2 text-sm">
            <span className="text-slate-500">Toplam kategori</span>
            <p className="font-semibold text-brand-900">{rows.length}</p>
          </div>
        }
      />

      <SectionCard
        title="Kategori ekle"
        description="Boş üst kategori alanı kök segment oluşturur."
      >
        <ActionForm action={createCategory} submitLabel="Kategori ekle">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label="Ad" required placeholder="Örn. Elektrik malzemeleri" />
            <TextInput name="slug" label="Slug" required placeholder="ornek-slug" />
            <SelectInput
              name="parent_id"
              label="Üst kategori"
              options={parentOptions}
            />
            <TextInput
              name="sort_order"
              label="Sıra (isteğe bağlı)"
              type="number"
              placeholder="Boş bırakılırsa otomatik"
            />
          </div>
        </ActionForm>
      </SectionCard>

      {rows.length === 0 ? (
        <EmptyState
          title="Henüz kategori yok"
          description="Yukarıdaki formu kullanarak ilk segmentinizi ekleyin."
        />
      ) : (
        <section className="space-y-3">
          <h3 className="font-semibold text-brand-900">Mevcut kategoriler</h3>
          <CategoryTreeList categories={rows} />
        </section>
      )}

      <p className="text-sm text-slate-500">
        <Link href="/panel/admin" className="font-medium text-brand-700 hover:underline">
          Moderasyon paneline dön
        </Link>
      </p>
    </div>
  );
}
