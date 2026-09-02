"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/roles";
import {
  getNextSiblingSortOrder,
  wouldCreateCycle,
  type CategoryRow,
} from "@/lib/categories";
import {
  normalizeCategorySlug,
  validateCategory,
} from "@/lib/forms/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupplierProfileForUser,
  matchPublishedSupplierByName,
  resolveSupplierProfileForUser,
  resolveSupplierPublishStatus,
} from "@/lib/suppliers/resolve";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveUnitPrice, normalizeProductName, productNamesMatch } from "@/lib/purchases";
import type { AppRole, ContentStatus } from "@/lib/supabase/database.types";

function revalidateSupplierPaths(supplierProfileId?: string | null) {
  revalidatePath("/panel/tedarikci");
  revalidatePath("/panel/tedarikci/profil");
  revalidatePath("/panel/tedarikci/urunler");
  revalidatePath("/panel/tedarikci/pinler");
  revalidatePath("/panel/urun-ekle");
  revalidatePath("/harita");
  revalidatePath("/urunler");
  if (supplierProfileId) {
    revalidatePath(`/tedarikci/${supplierProfileId}`);
  }
}

async function publishSupplierPendingContent(
  supabase: SupabaseClient,
  profileId: string,
) {
  await supabase
    .from("supplier_locations")
    .update({ status: "published" })
    .eq("supplier_profile_id", profileId)
    .eq("status", "pending");

  await supabase
    .from("products")
    .update({ status: "published" })
    .eq("supplier_profile_id", profileId)
    .eq("status", "pending");
}

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

export async function createWarehouse(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name) return { error: "Depo adı zorunludur." };

  const { error } = await session.supabase.from("warehouses").insert({
    owner_id: session.user.id,
    name,
    address: address || null,
    notes: notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/depolar");
  return { ok: true, message: "Depo eklendi." };
}

export async function archiveWarehouse(warehouseId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { error } = await session.supabase
    .from("warehouses")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", warehouseId)
    .eq("owner_id", session.user.id);

  if (error) return { error: error.message };
  revalidatePath("/panel/depolar");
  return { ok: true };
}

export async function createSiteProgressEntry(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const site_id = String(formData.get("site_id") ?? "").trim() || null;
  const warehouse_id = String(formData.get("warehouse_id") ?? "").trim() || null;
  const logged_at =
    String(formData.get("logged_at") ?? "") ||
    new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim();
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const { validateDailyLog } = await import("@/lib/forms/schemas");
  const fieldErrors = validateDailyLog(
    {
      site_id: site_id ?? "",
      warehouse_id: warehouse_id ?? "",
      logged_at,
      note,
    },
    files.length,
  );
  if (Object.keys(fieldErrors).length > 0) {
    return {
      error:
        fieldErrors.files ??
        fieldErrors.logged_at ??
        fieldErrors.site_id ??
        fieldErrors.warehouse_id ??
        fieldErrors.note ??
        "Formu kontrol edin.",
    };
  }

  const {
    uploadDailyLogPhotos,
    validateProgressFiles,
    PROGRESS_BUCKET,
  } = await import("@/lib/storage/site-progress");

  const fileError = validateProgressFiles(files);
  if (fileError) return { error: fileError };

  if (site_id) {
    const { data: site, error: siteError } = await session.supabase
      .from("sites")
      .select("id")
      .eq("id", site_id)
      .is("archived_at", null)
      .maybeSingle();

    if (siteError || !site) {
      return { error: siteError?.message ?? "Şantiye bulunamadı." };
    }
  }

  if (warehouse_id) {
    const { data: warehouse, error: warehouseError } = await session.supabase
      .from("warehouses")
      .select("id")
      .eq("id", warehouse_id)
      .is("archived_at", null)
      .maybeSingle();

    if (warehouseError || !warehouse) {
      return { error: warehouseError?.message ?? "Depo bulunamadı." };
    }
  }

  const { data: entry, error: entryError } = await session.supabase
    .from("site_progress_entries")
    .insert({
      site_id,
      warehouse_id,
      created_by: session.user.id,
      logged_at,
      note: note || null,
    })
    .select("id")
    .single();

  if (entryError || !entry) {
    return { error: entryError?.message ?? "Kayıt oluşturulamadı." };
  }

  if (files.length > 0) {
    const { uploads, error: uploadError } = await uploadDailyLogPhotos(
      session.supabase,
      session.user.id,
      entry.id,
      files,
    );

    if (uploadError) {
      await session.supabase.from("site_progress_entries").delete().eq("id", entry.id);
      return { error: uploadError };
    }

    const { error: photosError } = await session.supabase
      .from("site_progress_photos")
      .insert(
        uploads.map((u) => ({
          entry_id: entry.id,
          storage_path: u.storage_path,
          sort_order: u.sort_order,
        })),
      );

    if (photosError) {
      await session.supabase.storage
        .from(PROGRESS_BUCKET)
        .remove(uploads.map((u) => u.storage_path));
      await session.supabase.from("site_progress_entries").delete().eq("id", entry.id);
      return { error: photosError.message };
    }
  }

  revalidatePath("/panel/gunluk");
  if (site_id) {
    revalidatePath(`/panel/santiyeler/${site_id}`);
    revalidatePath("/panel/santiyeler");
  }
  if (warehouse_id) {
    revalidatePath(`/panel/depolar/${warehouse_id}`);
    revalidatePath("/panel/depolar");
  }
  return { ok: true, message: "Günlük kaydı eklendi." };
}

export async function archiveSiteProgressEntry(entryId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { data: entry, error: fetchError } = await session.supabase
    .from("site_progress_entries")
    .select("id, site_id, warehouse_id")
    .eq("id", entryId)
    .is("archived_at", null)
    .maybeSingle();

  if (fetchError || !entry) {
    return { error: fetchError?.message ?? "Kayıt bulunamadı." };
  }

  const { error } = await session.supabase
    .from("site_progress_entries")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", entryId);

  if (error) return { error: error.message };
  revalidatePath("/panel/gunluk");
  if (entry.site_id) {
    revalidatePath(`/panel/santiyeler/${entry.site_id}`);
    revalidatePath("/panel/santiyeler");
  }
  if (entry.warehouse_id) {
    revalidatePath(`/panel/depolar/${entry.warehouse_id}`);
    revalidatePath("/panel/depolar");
  }
  return { ok: true };
}

export async function createProduct(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const isSupplierRole = session.role === "supplier" || session.role === "admin";
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
  const embedded_in_supplier = formData.get("embedded_in_supplier") === "on";

  if (!name) return { error: "Ürün adı zorunludur." };
  if (!category_id) return { error: "Segment seçin." };

  const hasLat = lat != null;
  const hasLng = lng != null;
  if (hasLat !== hasLng) {
    return { error: "Konum için hem enlem hem boylam seçin veya boş bırakın." };
  }

  let supplierProfileId: string | null = null;
  let productStatus: ContentStatus = "published";

  if (isSupplierRole) {
    const profile = await getSupplierProfileForUser(session);
    if (!profile) {
      return { error: "Önce tedarikçi profilinizi oluşturun." };
    }
    supplierProfileId = profile.id;
    productStatus = resolveSupplierPublishStatus(profile);
  } else {
    supplierProfileId = await resolveSupplierProfileForUser(
      session,
      sourced_from_text || undefined,
    );
  }

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
      embedded_in_supplier: !isSupplierRole && embedded_in_supplier,
      created_by: session.user.id,
      status: productStatus,
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

  // Tedarikçi ürünleri haritada ürün pini oluşturmaz; alıcı gömülü ürünler de oluşturmaz.
  const shouldCreateProductPin =
    !isSupplierRole &&
    !embedded_in_supplier &&
    hasLat &&
    hasLng &&
    product;

  if (shouldCreateProductPin) {
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

  revalidateSupplierPaths(supplierProfileId);
  if (product) revalidatePath(`/urunler/${product.id}`);

  return {
    ok: true,
    message: isSupplierRole
      ? productStatus === "published"
        ? "Ürün firmanıza bağlandı ve yayınlandı."
        : "Ürün kaydedildi. Profil onaylanınca otomatik yayınlanır."
      : supplierProfileId
        ? embedded_in_supplier
          ? "Ürün tedarikçi kataloğuna gömüldü."
          : "Ürün tedarikçiye bağlandı ve yayınlandı."
        : "Ürün katalogda yayınlandı.",
  };
}

export async function updateSupplierProduct(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };
  if (session.role !== "supplier" && session.role !== "admin") {
    return { error: "Tedarikçi rolü gerekli." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Ürün bulunamadı." };

  const profile = await getSupplierProfileForUser(session);
  if (!profile && session.role !== "admin") {
    return { error: "Önce tedarikçi profilinizi oluşturun." };
  }

  const { data: existing } = await session.supabase
    .from("products")
    .select("id, supplier_profile_id, created_by, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { error: "Ürün bulunamadı." };

  const ownsAsSupplier =
    profile && existing.supplier_profile_id === profile.id;
  const isAdmin = session.role === "admin";
  if (!ownsAsSupplier && !isAdmin) {
    return { error: "Bu ürünü düzenleme yetkiniz yok." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const category_id = String(formData.get("category_id") ?? "") || null;
  const weight_kg = parseNum(formData.get("weight_kg"));
  const length_cm = parseNum(formData.get("length_cm"));
  const width_cm = parseNum(formData.get("width_cm"));
  const height_cm = parseNum(formData.get("height_cm"));
  const description = String(formData.get("description") ?? "").trim();
  const price = parseNum(formData.get("price"));

  if (!name) return { error: "Ürün adı zorunludur." };
  if (!category_id) return { error: "Segment seçin." };

  const nextStatus =
    existing.status === "rejected"
      ? resolveSupplierPublishStatus(profile)
      : existing.status === "pending" && profile
        ? resolveSupplierPublishStatus(profile)
        : existing.status;

  const { error } = await session.supabase
    .from("products")
    .update({
      name,
      category_id,
      weight_kg,
      length_cm,
      width_cm,
      height_cm,
      description: description || null,
      status: nextStatus,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (price != null) {
    await session.supabase.from("product_prices").insert({
      product_id: id,
      amount: price,
      reported_by: session.user.id,
    });
  }

  revalidateSupplierPaths(existing.supplier_profile_id);
  revalidatePath(`/urunler/${id}`);
  revalidatePath(`/panel/tedarikci/urunler/${id}`);
  return { ok: true, message: "Ürün güncellendi." };
}

export async function deleteSupplierProduct(productId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };
  if (session.role !== "supplier" && session.role !== "admin") {
    return { error: "Tedarikçi rolü gerekli." };
  }

  const profile = await getSupplierProfileForUser(session);
  const { data: existing } = await session.supabase
    .from("products")
    .select("id, supplier_profile_id")
    .eq("id", productId)
    .maybeSingle();

  if (!existing) return { error: "Ürün bulunamadı." };

  const ownsAsSupplier =
    profile && existing.supplier_profile_id === profile.id;
  if (!ownsAsSupplier && session.role !== "admin") {
    return { error: "Bu ürünü silme yetkiniz yok." };
  }

  await session.supabase
    .from("user_product_locations")
    .delete()
    .eq("product_id", productId);

  const { error } = await session.supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidateSupplierPaths(existing.supplier_profile_id);
  return { ok: true };
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
  const unit_price = resolveUnitPrice(
    parseNum(formData.get("unit_price")),
    parseNum(formData.get("total_price")),
    qty,
  );
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

  if (purchase) {
    const invoiceFiles = formData
      .getAll("invoices")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (invoiceFiles.length > 0) {
      const {
        uploadPurchaseInvoices,
        validateInvoiceFiles,
        PROGRESS_BUCKET,
      } = await import("@/lib/storage/purchase-invoices");

      const validationError = validateInvoiceFiles(invoiceFiles);
      if (validationError) {
        await session.supabase.from("purchases").delete().eq("id", purchase.id);
        return { error: validationError };
      }

      const { uploads, error: uploadError } = await uploadPurchaseInvoices(
        session.supabase,
        session.user.id,
        purchase.id,
        invoiceFiles,
      );

      if (uploadError) {
        await session.supabase.from("purchases").delete().eq("id", purchase.id);
        return { error: uploadError };
      }

      const { error: attachError } = await session.supabase
        .from("purchase_attachments")
        .insert(
          uploads.map((u) => ({
            purchase_id: purchase.id,
            site_id,
            storage_path: u.storage_path,
            file_name: u.file_name,
            content_type: u.content_type,
            byte_size: u.byte_size,
          })),
        );

      if (attachError) {
        await session.supabase.storage
          .from(PROGRESS_BUCKET)
          .remove(uploads.map((u) => u.storage_path));
        await session.supabase.from("purchases").delete().eq("id", purchase.id);
        return { error: attachError.message };
      }
    }
  }

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
  const offerId = String(formData.get("offer_id") ?? "").trim() || null;
  const purchased_at =
    String(formData.get("purchased_at") ?? "") || new Date().toISOString().slice(0, 10);
  let supplier_ref = String(formData.get("supplier_ref") ?? "").trim();
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

  let unit_price = resolveUnitPrice(
    parseNum(formData.get("unit_price")),
    parseNum(formData.get("total_price")),
    Number(item.qty),
  );

  if (offerId) {
    const { data: offer } = await session.supabase
      .from("purchase_list_item_offers")
      .select("*, supplier_profiles(org_name)")
      .eq("id", offerId)
      .eq("list_item_id", listItemId)
      .maybeSingle();

    if (offer) {
      if (unit_price == null && offer.unit_price != null) {
        unit_price = Number(offer.unit_price);
      }
      if (!supplier_ref) {
        const orgName = (offer.supplier_profiles as { org_name?: string } | null)
          ?.org_name;
        supplier_ref = orgName ?? offer.place_name?.trim() ?? "";
      }
    }
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
  const unit_price = resolveUnitPrice(
    parseNum(formData.get("unit_price")),
    parseNum(formData.get("total_price")),
    qty,
  );
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

export async function getPurchasePriceHistory(
  productName: string,
  siteId?: string | null,
) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." as const, rows: [] };

  const key = normalizeProductName(productName);
  if (!key) return { error: "Ürün adı gerekli." as const, rows: [] };

  let q = session.supabase
    .from("purchases")
    .select(
      "id, product_name, purchased_at, unit_price, qty, unit, currency, supplier_ref, sites(name)",
    )
    .is("archived_at", null)
    .order("purchased_at", { ascending: true });

  if (siteId) q = q.eq("site_id", siteId);

  const { data, error } = await q;
  if (error) return { error: error.message, rows: [] };

  const rows = (data ?? [])
    .filter((row) => productNamesMatch(row.product_name ?? productName, productName))
    .map((row) => ({
      id: row.id,
      purchased_at: row.purchased_at,
      site_name: (row.sites as { name?: string } | null)?.name ?? "—",
      unit_price: row.unit_price != null ? Number(row.unit_price) : null,
      qty: Number(row.qty),
      unit: row.unit,
      currency: row.currency,
      supplier_ref: row.supplier_ref,
    }));

  return { rows, productName: productName.trim() };
}

export async function createPurchaseListItemOffer(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const list_item_id = String(formData.get("list_item_id") ?? "");
  const supplier_profile_id =
    String(formData.get("supplier_profile_id") ?? "").trim() || null;
  const place_name = String(formData.get("place_name") ?? "").trim();
  const unit_price = parseNum(formData.get("unit_price"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!list_item_id) return { error: "Liste kalemi gerekli." };
  if (!supplier_profile_id && !place_name) {
    return { error: "Tedarikçi seçin veya yer adı girin." };
  }

  const { data: item, error: itemError } = await session.supabase
    .from("purchase_list_items")
    .select("site_id")
    .eq("id", list_item_id)
    .is("archived_at", null)
    .maybeSingle();

  if (itemError || !item) {
    return { error: itemError?.message ?? "Liste kalemi bulunamadı." };
  }

  const { error } = await session.supabase.from("purchase_list_item_offers").insert({
    list_item_id,
    site_id: item.site_id,
    supplier_profile_id,
    place_name: place_name || null,
    unit_price,
    notes: notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alinacaklar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function updatePurchaseListItemOffer(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const id = String(formData.get("id") ?? "");
  const supplier_profile_id =
    String(formData.get("supplier_profile_id") ?? "").trim() || null;
  const place_name = String(formData.get("place_name") ?? "").trim();
  const unit_price = parseNum(formData.get("unit_price"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id) return { error: "Teklif bulunamadı." };
  if (!supplier_profile_id && !place_name) {
    return { error: "Tedarikçi seçin veya yer adı girin." };
  }

  const { error } = await session.supabase
    .from("purchase_list_item_offers")
    .update({
      supplier_profile_id,
      place_name: place_name || null,
      unit_price,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alinacaklar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function deletePurchaseListItemOffer(offerId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { error } = await session.supabase
    .from("purchase_list_item_offers")
    .delete()
    .eq("id", offerId);

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alinacaklar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function uploadPurchaseAttachments(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const purchase_id = String(formData.get("purchase_id") ?? "");
  const site_id = String(formData.get("site_id") ?? "");
  const files = formData
    .getAll("invoices")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!purchase_id || !site_id) return { error: "Satın alım kaydı gerekli." };
  if (!files.length) return { error: "Dosya seçin." };

  const { data: existing } = await session.supabase
    .from("purchase_attachments")
    .select("id")
    .eq("purchase_id", purchase_id);

  const {
    uploadPurchaseInvoices,
    validateInvoiceFiles,
    PROGRESS_BUCKET,
  } = await import("@/lib/storage/purchase-invoices");

  const validationError = validateInvoiceFiles(files, existing?.length ?? 0);
  if (validationError) return { error: validationError };

  const { uploads, error: uploadError } = await uploadPurchaseInvoices(
    session.supabase,
    session.user.id,
    purchase_id,
    files,
  );

  if (uploadError) return { error: uploadError };

  const { error: attachError } = await session.supabase.from("purchase_attachments").insert(
    uploads.map((u) => ({
      purchase_id,
      site_id,
      storage_path: u.storage_path,
      file_name: u.file_name,
      content_type: u.content_type,
      byte_size: u.byte_size,
    })),
  );

  if (attachError) {
    await session.supabase.storage
      .from(PROGRESS_BUCKET)
      .remove(uploads.map((u) => u.storage_path));
    return { error: attachError.message };
  }

  revalidatePath("/panel/satin-alimlar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function deletePurchaseAttachment(attachmentId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };

  const { data: attachment, error: fetchError } = await session.supabase
    .from("purchase_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .maybeSingle();

  if (fetchError || !attachment) {
    return { error: fetchError?.message ?? "Dosya bulunamadı." };
  }

  const { PROGRESS_BUCKET } = await import("@/lib/storage/purchase-invoices");

  await session.supabase.storage
    .from(PROGRESS_BUCKET)
    .remove([attachment.storage_path]);

  const { error } = await session.supabase
    .from("purchase_attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) return { error: error.message };
  revalidatePath("/panel/satin-alimlar");
  revalidatePath("/panel/santiyeler");
  return { ok: true };
}

export async function getPurchaseAttachments(purchaseId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli.", attachments: [] };

  const { data, error } = await session.supabase
    .from("purchase_attachments")
    .select("*")
    .eq("purchase_id", purchaseId)
    .order("created_at");

  if (error) return { error: error.message, attachments: [] };

  const { createInvoiceSignedUrls } = await import("@/lib/storage/purchase-invoices");
  const paths = (data ?? []).map((a) => a.storage_path);
  const signed = await createInvoiceSignedUrls(session.supabase, paths);

  const attachments = (data ?? []).map((a) => ({
    ...a,
    url: signed.get(a.storage_path) ?? null,
  }));

  return { attachments };
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

  const { data: existing } = await session.supabase
    .from("supplier_profiles")
    .select("id, status")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const keepPublished = existing?.status === "published";
  const payload = {
    user_id: session.user.id,
    org_name,
    city: city || null,
    district: district || null,
    public_phone: public_phone || null,
    website: website || null,
    category_focus: category_focus || null,
    kvkk_consent_at: new Date().toISOString(),
    status: (keepPublished ? "published" : "pending") as ContentStatus,
  };

  const { error } = existing
    ? await session.supabase
        .from("supplier_profiles")
        .update(payload)
        .eq("id", existing.id)
    : await session.supabase.from("supplier_profiles").insert(payload);

  if (error) return { error: error.message };
  revalidateSupplierPaths(existing?.id);
  return {
    ok: true,
    message: keepPublished
      ? "Profil güncellendi."
      : "Profil onay için gönderildi.",
  };
}

export async function createSupplierLocation(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };
  if (session.role !== "supplier" && session.role !== "admin") {
    return { error: "Tedarikçi rolü gerekli." };
  }

  const profile = await getSupplierProfileForUser(session);
  if (!profile) return { error: "Önce tedarikçi profili oluşturun." };

  const label = String(formData.get("label") ?? "").trim();
  const lat = parseNum(formData.get("lat"));
  const lng = parseNum(formData.get("lng"));

  if (lat == null || lng == null) return { error: "Haritadan konum seçin." };

  const pinStatus = resolveSupplierPublishStatus(profile);

  const { error } = await session.supabase.from("supplier_locations").insert({
    supplier_profile_id: profile.id,
    label: label || null,
    lat,
    lng,
    status: pinStatus,
  });

  if (error) return { error: error.message };
  revalidateSupplierPaths(profile.id);
  return {
    ok: true,
    message:
      pinStatus === "published"
        ? "Pin yayınlandı."
        : "Pin kaydedildi. Profil onaylanınca otomatik yayınlanır.",
  };
}

export async function updateSupplierLocation(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };
  if (session.role !== "supplier" && session.role !== "admin") {
    return { error: "Tedarikçi rolü gerekli." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Pin bulunamadı." };

  const profile = await getSupplierProfileForUser(session);
  if (!profile && session.role !== "admin") {
    return { error: "Önce tedarikçi profili oluşturun." };
  }

  const { data: existing } = await session.supabase
    .from("supplier_locations")
    .select("id, supplier_profile_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { error: "Pin bulunamadı." };
  if (
    profile &&
    existing.supplier_profile_id !== profile.id &&
    session.role !== "admin"
  ) {
    return { error: "Bu pini düzenleme yetkiniz yok." };
  }

  const label = String(formData.get("label") ?? "").trim();
  const lat = parseNum(formData.get("lat"));
  const lng = parseNum(formData.get("lng"));
  if (lat == null || lng == null) return { error: "Haritadan konum seçin." };

  const { error } = await session.supabase
    .from("supplier_locations")
    .update({
      label: label || null,
      lat,
      lng,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateSupplierPaths(existing.supplier_profile_id);
  return { ok: true, message: "Pin güncellendi." };
}

export async function deleteSupplierLocation(locationId: string) {
  const session = await getSessionUser();
  if (!session) return { error: "Giriş gerekli." };
  if (session.role !== "supplier" && session.role !== "admin") {
    return { error: "Tedarikçi rolü gerekli." };
  }

  const profile = await getSupplierProfileForUser(session);
  const { data: existing } = await session.supabase
    .from("supplier_locations")
    .select("id, supplier_profile_id")
    .eq("id", locationId)
    .maybeSingle();

  if (!existing) return { error: "Pin bulunamadı." };
  if (
    profile &&
    existing.supplier_profile_id !== profile.id &&
    session.role !== "admin"
  ) {
    return { error: "Bu pini silme yetkiniz yok." };
  }

  const { error } = await session.supabase
    .from("supplier_locations")
    .delete()
    .eq("id", locationId);

  if (error) return { error: error.message };
  revalidateSupplierPaths(existing.supplier_profile_id);
  return { ok: true };
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

  if (table === "supplier_profiles" && status === "published") {
    await publishSupplierPendingContent(session.supabase, id);
  }

  revalidatePath("/panel/admin");
  revalidatePath("/harita");
  revalidatePath("/urunler");
  revalidatePath("/panel/tedarikci");
  if (table === "supplier_profiles") {
    revalidatePath(`/tedarikci/${id}`);
  }
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

function revalidateCategoryPaths() {
  revalidatePath("/panel/kategoriler");
  revalidatePath("/panel/admin");
  revalidatePath("/urunler");
  revalidatePath("/harita");
  revalidatePath("/panel/urun-ekle");
}

function categoryDbError(message: string): string {
  if (message.includes("categories_slug_key") || message.includes("duplicate key")) {
    return "Bu slug zaten kullanılıyor.";
  }
  return message;
}

function parseCategoryForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: normalizeCategorySlug(String(formData.get("slug") ?? "")),
    parent_id: String(formData.get("parent_id") ?? "") || null,
    sort_order: String(formData.get("sort_order") ?? "").trim(),
  };
}

export async function createCategory(formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Admin gerekli." };

  const values = parseCategoryForm(formData);
  const errors = validateCategory({
    name: values.name,
    slug: values.slug,
    parent_id: values.parent_id ?? "",
    sort_order: values.sort_order,
  });
  if (Object.keys(errors).length > 0) {
    return { error: Object.values(errors)[0] };
  }

  const { data: existing } = await session.supabase
    .from("categories")
    .select("id, parent_id, sort_order");

  const categories = (existing ?? []) as CategoryRow[];
  const sortOrder = values.sort_order
    ? Number(values.sort_order.replace(",", "."))
    : getNextSiblingSortOrder(categories, values.parent_id);

  const { error } = await session.supabase.from("categories").insert({
    name: values.name,
    slug: values.slug,
    parent_id: values.parent_id,
    sort_order: sortOrder,
  });

  if (error) return { error: categoryDbError(error.message) };
  revalidateCategoryPaths();
  return { ok: true };
}

export async function updateCategory(formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Admin gerekli." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Kategori bulunamadı." };

  const values = parseCategoryForm(formData);
  const errors = validateCategory({
    name: values.name,
    slug: values.slug,
    parent_id: values.parent_id ?? "",
    sort_order: values.sort_order,
  });
  if (Object.keys(errors).length > 0) {
    return { error: Object.values(errors)[0] };
  }

  const { data: existing } = await session.supabase
    .from("categories")
    .select("id, parent_id, sort_order, slug, name");

  const categories = (existing ?? []) as CategoryRow[];
  if (!categories.some((c) => c.id === id)) return { error: "Kategori bulunamadı." };

  if (wouldCreateCycle(id, values.parent_id, categories)) {
    return { error: "Üst kategori döngü oluşturur." };
  }

  const current = categories.find((c) => c.id === id)!;
  const sortOrder = values.sort_order
    ? Number(values.sort_order.replace(",", "."))
    : current.sort_order;

  const { error } = await session.supabase
    .from("categories")
    .update({
      name: values.name,
      slug: values.slug,
      parent_id: values.parent_id,
      sort_order: sortOrder,
    })
    .eq("id", id);

  if (error) return { error: categoryDbError(error.message) };
  revalidateCategoryPaths();
  return { ok: true };
}

export async function deleteCategory(categoryId: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Admin gerekli." };

  const { count, error: childError } = await session.supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", categoryId);

  if (childError) return { error: childError.message };
  if ((count ?? 0) > 0) {
    return { error: "Önce alt kategorileri silin veya taşıyın." };
  }

  const { error } = await session.supabase.from("categories").delete().eq("id", categoryId);
  if (error) return { error: error.message };

  revalidateCategoryPaths();
  return { ok: true };
}

export async function reorderCategory(
  categoryId: string,
  direction: "up" | "down",
) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Admin gerekli." };

  const { data: categories, error: fetchError } = await session.supabase
    .from("categories")
    .select("id, parent_id, sort_order");

  if (fetchError) return { error: fetchError.message };

  const rows = (categories ?? []) as CategoryRow[];
  const current = rows.find((c) => c.id === categoryId);
  if (!current) return { error: "Kategori bulunamadı." };

  const siblings = rows
    .filter((c) => c.parent_id === current.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const index = siblings.findIndex((c) => c.id === categoryId);
  if (index < 0) return { error: "Kategori bulunamadı." };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return { ok: true };

  const neighbor = siblings[swapIndex];
  const currentOrder = current.sort_order;
  const neighborOrder = neighbor.sort_order;

  const { error: firstError } = await session.supabase
    .from("categories")
    .update({ sort_order: neighborOrder })
    .eq("id", current.id);
  if (firstError) return { error: firstError.message };

  const { error: secondError } = await session.supabase
    .from("categories")
    .update({ sort_order: currentOrder })
    .eq("id", neighbor.id);
  if (secondError) return { error: secondError.message };

  revalidateCategoryPaths();
  return { ok: true };
}

function parseNum(value: FormDataEntryValue | null): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}
