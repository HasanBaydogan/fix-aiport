export type AppRole = "buyer" | "supplier" | "admin";
export type ContentStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "archived";
export type RoleRequestStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  display_name: string | null;
  phone: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  category_id: string | null;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  dimension_unit: string;
  sourced_from_text: string | null;
  supplier_profile_id: string | null;
  images: string[];
  description: string | null;
  status: ContentStatus;
  moderation_note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
};

export type ProductPrice = {
  id: string;
  product_id: string;
  amount: number;
  currency: string;
  reported_by: string;
  observed_at: string;
  note: string | null;
  created_at: string;
};

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type SupplierProfile = {
  id: string;
  user_id: string;
  org_name: string;
  city: string | null;
  district: string | null;
  public_phone: string | null;
  website: string | null;
  category_focus: string | null;
  kvkk_consent_at: string | null;
  status: ContentStatus;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierLocation = {
  id: string;
  supplier_profile_id: string;
  label: string | null;
  lat: number;
  lng: number;
  status: ContentStatus;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceReview = {
  id: string;
  supplier_profile_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type Site = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteStock = {
  id: string;
  site_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit: string;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  sites?: { name: string } | null;
};

export type Purchase = {
  id: string;
  site_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit: string;
  unit_price: number | null;
  currency: string;
  purchased_at: string;
  supplier_ref: string | null;
  notes: string | null;
  purchase_lat: number | null;
  purchase_lng: number | null;
  purchase_location_label: string | null;
  archived_at: string | null;
  created_at: string;
  sites?: { name: string } | null;
};

export type UserProductLocation = {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  purchase_id: string | null;
  supplier_profile_id: string | null;
  label: string | null;
  lat: number;
  lng: number;
  notes: string | null;
  status: ContentStatus;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseListItem = {
  id: string;
  site_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit: string;
  priority: number;
  notes: string | null;
  purchase_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  sites?: { name: string } | null;
};

export type RoleRequest = {
  id: string;
  user_id: string;
  requested_role: AppRole;
  note: string | null;
  status: RoleRequestStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};
