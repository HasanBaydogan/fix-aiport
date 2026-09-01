"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/roles";
import {
  matchPublishedSupplierByName,
  resolveSupplierProfileForUser,
} from "@/lib/suppliers/resolve";
import { createServiceClient } from "@/lib/supabase/admin";
import type { AppRole, ContentStatus } from "@/lib/supabase/database.types";

export async function createSite(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return { error: "Şantiye adı zorunludur." };

  const { error } = await session.supabase.from("sites").insert({
    owner_id: session.user.id,
    name,
    address: address || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function archiveSite(siteId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { error } = await session.supabase
    .from("sites")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", siteId)
    .eq("owner_id", session.user.id);

  if (error) return { error: error.message };
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function createProduct(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const name = String(formData.get("name") ?? "").trim();
  const category_id = String(formData.get("category_id") ?? "") || null;
  const weight_kg = parseNum(formData.get("weight_kg"));
  const length_cm = parseNum(formData.get("length_cm"));
  const width_cm = parseNum(formData.get("width_cm"));
  const height_cm = parseNum(formData.get("height_cm"));
  const sourced_from_text = String(formData.get("sourced_from_text") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = parseNum(formData.get("price"));
  const lat = parseNum(formData.get("lat"));
  const lng = parseNum(formData.get("lng"));
  const location_label = String(formData.get("location_label") ?? "").trim();

  if (!name) return { error: "Ürün adı zorunludur." };
  if (!category_id) return { error: "Segment seçin." };

  const hasLat = lat != null;
  const hasLng = lng != null;
  if (hasLat !== hasLng) {
    return { error: "Konum için hem enlem hem boylam seçin veya boş bırakın." };
  }

  const supplierProfileId = await resolveSupplierProfileForUser(
    session,
    sourced_from_text || undefined,
  );

  const { data: product, error } = await session.supabase
    .from("products")
    .insert({
      name,
      category_id,
      weight_kg,
      length_cm,
      width_cm,
      height_cm,
      sourced_from_text: sourced_from_text || null,
      description: description || null,
      supplier_profile_id: supplierProfileId,
      created_by: session.user.id,
      status: "published",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (price != null && product) {
    await session.supabase.from("product_prices").insert({
      product_id: product.id,
      amount: price,
      reported_by: session.user.id,
    });
  }

  if (hasLat && hasLng && product) {
    await session.supabase.from("user_product_locations").insert({
      user_id: session.user.id,
      product_id: product.id,
      product_name: name,
      supplier_profile_id: supplierProfileId,
      label: location_label || sourced_from_text || name,
      lat,
      lng,
      status: "published",
    });
  }

  revalidatePath("/panel/urun-ekle");
  revalidatePath("/urunler");
  revalidatePath("/harita");
  return {
    ok: true,
    message: supplierProfileId
      ? "Ürün tedarikçiye bağlandı ve yayınlandı."
      : "Ürün katalogda yayınlandı.",
  };
}

export async function createStock(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const site_id = String(formData.get("site_id") ?? "");
  const product_name = String(formData.get("product_name") ?? "").trim();
  const qty = parseNum(formData.get("qty"));
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!site_id || !product_name || qty == null) {
    return { error: "Şantiye, ürün adı ve miktar zorunludur." };
  }

  const { error } = await session.supabase.from("site_stock").insert({
    site_id,
    product_name,
    qty,
    unit,
    notes: notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/stok");
  return { ok: true };
}

export async function createPurchase(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const site_id = String(formData.get("site_id") ?? "");
  const product_name = String(formData.get("product_name") ?? "").trim();
  const qty = parseNum(formData.get("qty"));
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const unit_price = parseNum(formData.get("unit_price"));
  const purchased_at =
    String(formData.get("purchased_at") ?? "") || new Date().toISOString().slice(0, 10);
  const supplier_ref = String(formData.get("supplier_ref") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const purchase_lat = parseNum(formData.get("lat"));
  const purchase_lng = parseNum(formData.get("lng"));
  const purchase_location_label = String(
    formData.get("purchase_location_label") ?? "",
  ).trim();

  if (!site_id || !product_name || qty == null) {
    return { error: "Şantiye, ürün adı ve miktar zorunludur." };
  }

  const hasLat = purchase_lat != null;
  const hasLng = purchase_lng != null;
  if (hasLat !== hasLng) {
    return { error: "Konum için hem enlem hem boylam seçin veya boş bırakın." };
  }

  const { data: purchase, error } = await session.supabase
    .from("purchases")
    .insert({
      site_id,
      product_name,
      qty,
      unit,
      unit_price,
      purchased_at,
      supplier_ref: supplier_ref || null,
      notes: notes || null,
      purchase_lat: hasLat ? purchase_lat : null,
      purchase_lng: hasLng ? purchase_lng : null,
      purchase_location_label: purchase_location_label || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (hasLat && hasLng && purchase) {
    const supplierProfileId = await matchPublishedSupplierByName(
      session.supabase,
      supplier_ref || purchase_location_label,
    );
    await session.supabase.from("user_product_locations").insert({
      user_id: session.user.id,
      product_name,
      purchase_id: purchase.id,
      supplier_profile_id: supplierProfileId,
      label: purchase_location_label || supplier_ref || product_name,
      lat: purchase_lat,
      lng: purchase_lng,
      notes: notes || supplier_ref || null,
      status: "published",
    });
  }

  revalidatePath("/panel/satin-alimlar");
  revalidatePath("/panel/konumlar");
  revalidatePath("/harita");
  return { ok: true };
}

export async function createUserProductLocation(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const product_name = String(formData.get("product_name") ?? "").trim();
  const product_id = String(formData.get("product_id") ?? "") || null;
  const label = String(formData.get("label") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const lat = parseNum(formData.get("lat"));
  const lng = parseNum(formData.get("lng"));

  if (!product_name) return { error: "Ürün adı zorunludur." };
  if (lat == null || lng == null) return { error: "Haritadan konum seçin." };

  const supplierProfileId = await matchPublishedSupplierByName(
    session.supabase,
    label || notes,
  );

  const { error } = await session.supabase.from("user_product_locations").insert({
    user_id: session.user.id,
    product_id,
    product_name,
    supplier_profile_id: supplierProfileId,
    label: label || null,
    lat,
    lng,
    notes: notes || null,
    status: "published",
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/konumlar");
  revalidatePath("/harita");
  return {
    ok: true,
    message: "Ürün konumu kaydedildi ve haritada yayınlandı.",
  };
}

export async function createPurchaseListItem(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const site_id = String(formData.get("site_id") ?? "");
  const product_name = String(formData.get("product_name") ?? "").trim();
  const qty = parseNum(formData.get("qty")) ?? 1;
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const priority = Number(formData.get("priority") ?? 0) || 0;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!site_id || !product_name) {
    return { error: "Şantiye ve ürün adı zorunludur." };
  }

  const { error } = await session.supabase.from("purchase_list_items").insert({
    site_id,
    product_name,
    qty,
    unit,
    priority,
    notes: notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alinacaklar");
  return { ok: true };
}

export async function fulfillPurchaseListItem(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const listItemId = String(formData.get("list_item_id") ?? "");
  const unit_price = parseNum(formData.get("unit_price"));
  const purchased_at =
    String(formData.get("purchased_at") ?? "") || new Date().toISOString().slice(0, 10);
  const supplier_ref = String(formData.get("supplier_ref") ?? "").trim();
  const addToStock = formData.get("add_to_stock") === "on";

  if (!listItemId) return { error: "Liste kalemi bulunamadı." };

  const { data: item, error: fetchError } = await session.supabase
    .from("purchase_list_items")
    .select("*")
    .eq("id", listItemId)
    .is("archived_at", null)
    .maybeSingle();

  if (fetchError || !item) {
    return { error: fetchError?.message ?? "Liste kalemi bulunamadı." };
  }

  const { data: purchase, error: purchaseError } = await session.supabase
    .from("purchases")
    .insert({
      site_id: item.site_id,
      product_id: item.product_id,
      product_name: item.product_name,
      qty: item.qty,
      unit: item.unit,
      unit_price,
      purchased_at,
      supplier_ref: supplier_ref || null,
      notes: item.notes,
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    return { error: purchaseError?.message ?? "Satın alma kaydı oluşturulamadı." };
  }

  if (addToStock) {
    const { data: existing } = await session.supabase
      .from("site_stock")
      .select("id, qty")
      .eq("site_id", item.site_id)
      .eq("product_name", item.product_name)
      .eq("unit", item.unit)
      .is("archived_at", null)
      .maybeSingle();

    if (existing) {
      await session.supabase
        .from("site_stock")
        .update({ qty: Number(existing.qty) + Number(item.qty) })
        .eq("id", existing.id);
    } else {
      await session.supabase.from("site_stock").insert({
        site_id: item.site_id,
        product_id: item.product_id,
        product_name: item.product_name,
        qty: item.qty,
        unit: item.unit,
        notes: item.notes,
      });
    }
  }

  const { error: archiveError } = await session.supabase
    .from("purchase_list_items")
    .update({
      archived_at: new Date().toISOString(),
      purchase_id: purchase.id,
    })
    .eq("id", listItemId);

  if (archiveError) return { error: archiveError.message };

  revalidatePath("/panel/satin-alinacaklar");
  revalidatePath("/panel/satin-alimlar");
  revalidatePath("/panel/stok");
  revalidatePath("/panel/santiyeler");
  return { ok: true, message: "Satın alındı olarak kaydedildi." };
}

export async function updateStock(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const id = String(formData.get("id") ?? "");
  const product_name = String(formData.get("product_name") ?? "").trim();
  const qty = parseNum(formData.get("qty"));
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !product_name || qty == null) {
    return { error: "Ürün adı ve miktar zorunludur." };
  }

  const { error } = await session.supabase
    .from("site_stock")
    .update({ product_name, qty, unit, notes: notes || null })
    .eq("id", id)
    .is("archived_at", null);

  if (error) return { error: error.message };
  revalidatePath("/panel/stok");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function archiveStock(stockId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { error } = await session.supabase
    .from("site_stock")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", stockId);

  if (error) return { error: error.message };
  revalidatePath("/panel/stok");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function updatePurchase(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const id = String(formData.get("id") ?? "");
  const product_name = String(formData.get("product_name") ?? "").trim();
  const qty = parseNum(formData.get("qty"));
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const unit_price = parseNum(formData.get("unit_price"));
  const purchased_at = String(formData.get("purchased_at") ?? "");
  const supplier_ref = String(formData.get("supplier_ref") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !product_name || qty == null || !purchased_at) {
    return { error: "Ürün, miktar ve tarih zorunludur." };
  }

  const { error } = await session.supabase
    .from("purchases")
    .update({
      product_name,
      qty,
      unit,
      unit_price,
      purchased_at,
      supplier_ref: supplier_ref || null,
      notes: notes || null,
    })
    .eq("id", id)
    .is("archived_at", null);

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alimlar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function archivePurchase(purchaseId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { error } = await session.supabase
    .from("purchases")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", purchaseId);

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alimlar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function updatePurchaseListItem(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const id = String(formData.get("id") ?? "");
  const product_name = String(formData.get("product_name") ?? "").trim();
  const qty = parseNum(formData.get("qty")) ?? 1;
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const priority = Number(formData.get("priority") ?? 0) || 0;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !product_name) return { error: "Ürün adı zorunludur." };

  const { error } = await session.supabase
    .from("purchase_list_items")
    .update({ product_name, qty, unit, priority, notes: notes || null })
    .eq("id", id)
    .is("archived_at", null);

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alinacaklar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function archivePurchaseListItem(listItemId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { error } = await session.supabase
    .from("purchase_list_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", listItemId);

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alinacaklar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function upsertSupplierProfile(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };
  if (session.role !== "supplier" && session.role !== "admin") {
    return { error: "Tedarikçi rolü gerekli." };
  }

  const org_name = String(formData.get("org_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const public_phone = String(formData.get("public_phone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const category_focus = String(formData.get("category_focus") ?? "").trim();
  const kvkk = formData.get("kvkk_consent") === "on";

  if (!org_name) return { error: "Ticari unvan zorunludur." };
  if (!kvkk) return { error: "KVKK onayı zorunludur (R4)." };

  const payload = {
    user_id: session.user.id,
    org_name,
    city: city || null,
    district: district || null,
    public_phone: public_phone || null,
    website: website || null,
    category_focus: category_focus || null,
    kvkk_consent_at: new Date().toISOString(),
    status: "pending" as ContentStatus,
  };

  const { data: existing } = await session.supabase
    .from("supplier_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { error } = existing
    ? await session.supabase
        .from("supplier_profiles")
        .update(payload)
        .eq("id", existing.id)
    : await session.supabase.from("supplier_profiles").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/panel/tedarikci");
  return { ok: true, message: "Profil onay için gönderildi." };
}

export async function createSupplierLocation(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { data: profile } = await session.supabase
    .from("supplier_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile) return { error: "Önce tedarikçi profili oluşturun." };

  const label = String(formData.get("label") ?? "").trim();
  const lat = parseNum(formData.get("lat"));
  const lng = parseNum(formData.get("lng"));

  if (lat == null || lng == null) return { error: "Haritadan konum seçin." };

  const { error } = await session.supabase.from("supplier_locations").insert({
    supplier_profile_id: profile.id,
    label: label || null,
    lat,
    lng,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/tedarikci");
  revalidatePath("/harita");
  return { ok: true, message: "Pin onay için gönderildi." };
}

export async function createProductReview(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const product_id = String(formData.get("product_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const body = String(formData.get("body") ?? "").trim();

  if (!product_id || rating < 1 || rating > 5) {
    return { error: "Ürün ve 1–5 puan gerekli." };
  }

  const { error } = await session.supabase.from("product_reviews").upsert(
    {
      product_id,
      user_id: session.user.id,
      rating,
      body: body || null,
      status: "published",
    },
    { onConflict: "product_id,user_id" },
  );

  if (error) return { error: error.message };
  revalidatePath(`/urunler/${product_id}`);
  return { ok: true };
}

export async function createServiceReview(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const supplier_profile_id = String(formData.get("supplier_profile_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const body = String(formData.get("body") ?? "").trim();

  if (!supplier_profile_id || rating < 1 || rating > 5) {
    return { error: "Tedarikçi ve 1–5 puan gerekli." };
  }

  const { error } = await session.supabase.from("service_reviews").upsert(
    {
      supplier_profile_id,
      user_id: session.user.id,
      rating,
      body: body || null,
      status: "published",
    },
    { onConflict: "supplier_profile_id,user_id" },
  );

  if (error) return { error: error.message };
  revalidatePath("/harita");
  return { ok: true };
}

export async function moderateContent(
  table:
    | "products"
    | "supplier_profiles"
    | "supplier_locations"
    | "product_reviews"
    | "service_reviews"
    | "user_product_locations",
  id: string,
  status: ContentStatus,
  note?: string,
) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Admin gerekli." };

  const { error } = await session.supabase
    .from(table)
    .update({
      status,
      moderation_note: note || null,
    } as never)
    .eq("id", id);

  if (error) return { error: error.message };

  if (table === "products" && status === "published") {
    await session.supabase
      .from("user_product_locations")
      .update({ status: "published" })
      .eq("product_id", id);
  }

  revalidatePath("/panel/admin");
  revalidatePath("/harita");
  revalidatePath("/urunler");
  return { ok: true };
}

export async function reviewRoleRequest(
  requestId: string,
  decision: "approved" | "rejected",
  adminNote?: string,
) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Admin gerekli." };

  const { data: req, error: fetchError } = await session.supabase
    .from("role_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !req) return { error: fetchError?.message ?? "Bulunamadı." };

  const { error } = await session.supabase
    .from("role_requests")
    .update({
      status: decision,
      admin_note: adminNote || null,
      reviewed_by: session.user.id,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  if (decision === "approved") {
    const admin = createServiceClient();
    await admin.auth.admin.updateUserById(req.user_id, {
      app_metadata: { role: "supplier" as AppRole },
    });
    await admin
      .from("profiles")
      .update({ role: "supplier" })
      .eq("id", req.user_id);
  }

  revalidatePath("/panel/admin");
  return { ok: true };
}

export async function createCategory(formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Admin gerekli." };

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const parent_id = String(formData.get("parent_id") ?? "") || null;

  if (!name || !slug) return { error: "Ad ve slug zorunlu." };

  const { error } = await session.supabase.from("categories").insert({
    name,
    slug,
    parent_id,
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/admin");
  return { ok: true };
}

function parseNum(value: FormDataEntryValue | null): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}
