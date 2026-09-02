import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateSupplierProduct } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth/roles";
import { CategorySelect } from "@/components/forms/CategorySelect";
import {
  ActionForm,
  TextArea,
  TextInput,
} from "@/components/forms/ActionForm";
import { DeleteSupplierProductButton } from "@/components/panel/DeleteSupplierProductButton";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default async function TedarikciUrunEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/tedarikci/urunler");
  const { id } = await params;

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile && session.role !== "admin") {
    redirect("/panel/tedarikci/profil");
  }

  const [{ data: product }, { data: categories }, { data: latestPrice }] =
    await Promise.all([
      session.supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle(),
      session.supabase
        .from("categories")
        .select("id, name, slug, parent_id, sort_order")
        .order("sort_order"),
      session.supabase
        .from("product_prices")
        .select("amount")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!product) notFound();
  if (
    profile &&
    product.supplier_profile_id !== profile.id &&
    session.role !== "admin"
  ) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Tedarikçi"
        title="Ürün düzenle"
        description={product.name}
        actions={<Badge status={product.status} />}
      />

      <SectionCard title="Ürün bilgileri">
        <ActionForm action={updateSupplierProduct} submitLabel="Kaydet">
          <input type="hidden" name="id" value={product.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              name="name"
              label="Ürün adı"
              required
              defaultValue={product.name}
            />
            <CategorySelect
              name="category_id"
              label="Segment"
              required
              categories={categories ?? []}
              defaultValue={product.category_id ?? undefined}
            />
            <TextInput
              name="weight_kg"
              label="Ağırlık (kg)"
              type="number"
              step="0.001"
              defaultValue={
                product.weight_kg != null ? String(product.weight_kg) : ""
              }
            />
            <TextInput
              name="price"
              label="Yeni fiyat (TRY)"
              type="number"
              step="0.01"
              defaultValue={
                latestPrice?.amount != null ? String(latestPrice.amount) : ""
              }
            />
            <TextInput
              name="length_cm"
              label="Uzunluk (cm)"
              type="number"
              step="0.1"
              defaultValue={
                product.length_cm != null ? String(product.length_cm) : ""
              }
            />
            <TextInput
              name="width_cm"
              label="Genişlik (cm)"
              type="number"
              step="0.1"
              defaultValue={
                product.width_cm != null ? String(product.width_cm) : ""
              }
            />
            <TextInput
              name="height_cm"
              label="Yükseklik (cm)"
              type="number"
              step="0.1"
              defaultValue={
                product.height_cm != null ? String(product.height_cm) : ""
              }
            />
          </div>
          <TextArea
            name="description"
            label="Açıklama"
            defaultValue={product.description ?? ""}
          />
        </ActionForm>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/panel/tedarikci/urunler"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Ürün listesine dön
        </Link>
        <DeleteSupplierProductButton productId={product.id} />
        {product.status === "published" ? (
          <Link
            href={`/urunler/${product.id}`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Katalogda gör
          </Link>
        ) : null}
      </div>
    </div>
  );
}
