import type { DataScope } from "@/lib/forms/types";

export type SiteFormValues = {
  name: string;
  address: string;
};

export type SiteFormErrors = Partial<Record<keyof SiteFormValues, string>>;

export const siteFormMeta = {
  dataScope: "private" as DataScope,
};

export function validateSite(values: SiteFormValues): SiteFormErrors {
  const errors: SiteFormErrors = {};
  if (!values.name.trim()) errors.name = "Şantiye adı zorunludur.";
  return errors;
}

export type ProductFormValues = {
  name: string;
  category_id: string;
  weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  sourced_from_text: string;
  description: string;
  price: string;
};

export type ProductFormErrors = Partial<
  Record<keyof ProductFormValues | "files", string>
>;

export const productFormMeta = {
  dataScope: "global" as DataScope,
};

export function validateProduct(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};
  if (!values.name.trim()) errors.name = "Ürün adı zorunludur.";
  if (!values.category_id) errors.category_id = "Segment seçin.";
  if (values.price.trim() && Number.isNaN(Number(values.price.replace(",", ".")))) {
    errors.price = "Geçerli bir fiyat girin.";
  }
  return errors;
}

export type StockFormValues = {
  site_id: string;
  product_name: string;
  qty: string;
  unit: string;
  notes: string;
};

export type StockFormErrors = Partial<Record<keyof StockFormValues, string>>;

export const stockFormMeta = { dataScope: "private" as DataScope };

export function validateStock(values: StockFormValues): StockFormErrors {
  const errors: StockFormErrors = {};
  if (!values.site_id) errors.site_id = "Şantiye seçin.";
  if (!values.product_name.trim()) errors.product_name = "Ürün adı zorunludur.";
  const qty = Number(values.qty.replace(",", "."));
  if (!values.qty.trim() || Number.isNaN(qty)) errors.qty = "Miktar zorunludur.";
  return errors;
}

export type PurchaseFormValues = {
  site_id: string;
  product_name: string;
  qty: string;
  unit: string;
  unit_price: string;
  total_price: string;
  purchased_at: string;
  supplier_ref: string;
  notes: string;
};

export type PurchaseFormErrors = Partial<Record<keyof PurchaseFormValues, string>>;

export const purchaseFormMeta = { dataScope: "private" as DataScope };

export function validatePurchase(values: PurchaseFormValues): PurchaseFormErrors {
  const errors: PurchaseFormErrors = {};
  if (!values.site_id) errors.site_id = "Şantiye seçin.";
  if (!values.product_name.trim()) errors.product_name = "Ürün adı zorunludur.";
  const qty = Number(values.qty.replace(",", "."));
  if (!values.qty.trim() || Number.isNaN(qty)) errors.qty = "Miktar zorunludur.";
  return errors;
}

export type PurchaseListFormValues = {
  site_id: string;
  product_name: string;
  qty: string;
  unit: string;
  priority: string;
  notes: string;
};

export type PurchaseListFormErrors = Partial<
  Record<keyof PurchaseListFormValues, string>
>;

export const purchaseListFormMeta = { dataScope: "private" as DataScope };

export function validatePurchaseList(
  values: PurchaseListFormValues,
): PurchaseListFormErrors {
  const errors: PurchaseListFormErrors = {};
  if (!values.site_id) errors.site_id = "Şantiye seçin.";
  if (!values.product_name.trim()) errors.product_name = "Ürün adı zorunludur.";
  return errors;
}

export type SupplierProfileFormValues = {
  org_name: string;
  city: string;
  district: string;
  public_phone: string;
  website: string;
  category_focus: string;
  kvkk_consent: boolean;
};

export type SupplierProfileFormErrors = Partial<
  Record<keyof SupplierProfileFormValues, string>
>;

export const supplierProfileFormMeta = { dataScope: "global" as DataScope };

export function validateSupplierProfile(
  values: SupplierProfileFormValues,
): SupplierProfileFormErrors {
  const errors: SupplierProfileFormErrors = {};
  if (!values.org_name.trim()) errors.org_name = "Ticari unvan zorunludur.";
  if (!values.kvkk_consent) {
    errors.kvkk_consent = "Haritada görünmek için KVKK onayını işaretleyin.";
  }
  return errors;
}

export type LocationFormValues = {
  label: string;
  lat: string;
  lng: string;
};

export type LocationFormErrors = Partial<Record<keyof LocationFormValues, string>>;

export const locationFormMeta = { dataScope: "global" as DataScope };

export function validateLocation(values: LocationFormValues): LocationFormErrors {
  const errors: LocationFormErrors = {};
  const lat = Number(values.lat);
  const lng = Number(values.lng);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.lat = "Geçerli enlem girin.";
  if (Number.isNaN(lng) || lng < -180 || lng > 180) errors.lng = "Geçerli boylam girin.";
  return errors;
}

export type ReviewFormValues = {
  rating: string;
  body: string;
};

export type ReviewFormErrors = Partial<Record<keyof ReviewFormValues, string>>;

export function validateReview(values: ReviewFormValues): ReviewFormErrors {
  const errors: ReviewFormErrors = {};
  const rating = Number(values.rating);
  if (!rating || rating < 1 || rating > 5) errors.rating = "1–5 arası puan seçin.";
  return errors;
}

export type DailyLogFormValues = {
  site_id: string;
  warehouse_id: string;
  logged_at: string;
  note: string;
};

export type DailyLogFormErrors = Partial<
  Record<keyof DailyLogFormValues | "files", string>
>;

/** @deprecated Use DailyLogFormValues */
export type SiteProgressFormValues = DailyLogFormValues;

/** @deprecated Use DailyLogFormErrors */
export type SiteProgressFormErrors = DailyLogFormErrors;

export const dailyLogFormMeta = { dataScope: "private" as DataScope };

/** @deprecated Use dailyLogFormMeta */
export const siteProgressFormMeta = dailyLogFormMeta;

export function validateDailyLog(
  values: DailyLogFormValues,
  fileCount: number,
): DailyLogFormErrors {
  const errors: DailyLogFormErrors = {};
  if (!values.logged_at.trim()) errors.logged_at = "Tarih zorunludur.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.logged_at.trim())) {
    errors.logged_at = "Geçerli bir tarih girin.";
  }
  if (values.note.trim().length > 5000) {
    errors.note = "Not en fazla 5000 karakter olabilir.";
  }
  if (fileCount < 1 && !values.note.trim()) {
    errors.note = "Not yazın veya en az bir fotoğraf ekleyin.";
  }
  if (fileCount > 5) errors.files = "En fazla 5 fotoğraf ekleyebilirsiniz.";
  return errors;
}

/** @deprecated Use validateDailyLog */
export function validateSiteProgress(
  values: DailyLogFormValues,
  fileCount: number,
): DailyLogFormErrors {
  return validateDailyLog(values, fileCount);
}

export type CategoryFormValues = {
  name: string;
  slug: string;
  parent_id: string;
  sort_order: string;
};

export type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>;

export function normalizeCategorySlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateCategory(values: CategoryFormValues): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const name = values.name.trim();
  const slug = normalizeCategorySlug(values.slug);

  if (!name) errors.name = "Ad zorunludur.";
  else if (name.length < 2) errors.name = "Ad en az 2 karakter olmalıdır.";

  if (!slug) errors.slug = "Slug zorunludur.";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "Slug yalnızca küçük harf, rakam ve tire içerebilir.";
  }

  if (values.sort_order.trim()) {
    const sortOrder = Number(values.sort_order.replace(",", "."));
    if (Number.isNaN(sortOrder)) errors.sort_order = "Geçerli bir sıra numarası girin.";
  }

  return errors;
}
