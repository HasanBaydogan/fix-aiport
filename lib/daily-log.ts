import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedUrls } from "@/lib/storage/site-progress";
import type { SiteProgressEntry } from "@/lib/supabase/database.types";

export async function fetchDailyLogEntries(
  supabase: SupabaseClient,
  filters?: { siteId?: string; warehouseId?: string },
  limit = 100,
): Promise<SiteProgressEntry[]> {
  let query = supabase
    .from("site_progress_entries")
    .select("*, site_progress_photos(*), sites(name), warehouses(name)")
    .is("archived_at", null)
    .order("logged_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.siteId) {
    query = query.eq("site_id", filters.siteId);
  }
  if (filters?.warehouseId) {
    query = query.eq("warehouse_id", filters.warehouseId);
  }

  const { data: rows } = await query;
  const entries = (rows ?? []) as SiteProgressEntry[];
  const allPaths = entries.flatMap((e) =>
    (e.site_progress_photos ?? []).map((p) => p.storage_path),
  );
  const signedMap = await createSignedUrls(supabase, allPaths);

  return entries.map((entry) => ({
    ...entry,
    site_progress_photos: (entry.site_progress_photos ?? []).map((photo) => ({
      ...photo,
      url: signedMap.get(photo.storage_path) ?? null,
    })),
  }));
}

export async function fetchSiteAndWarehouseOptions(supabase: SupabaseClient) {
  const [{ data: sites }, { data: warehouses }] = await Promise.all([
    supabase
      .from("sites")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("warehouses")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
  ]);

  return {
    sites: sites ?? [],
    warehouses: warehouses ?? [],
  };
}
