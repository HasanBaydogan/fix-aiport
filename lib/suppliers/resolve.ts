import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/supabase/database.types";

type SessionContext = {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  role: AppRole;
  supabase: SupabaseClient;
};

/** R2/R4: auto-link supplier on product; buyers only match published profiles. */
export async function resolveSupplierProfileForUser(
  session: SessionContext,
  sourcedFromText?: string,
): Promise<string | null> {
  const { supabase, user, role } = session;

  if (role === "supplier" || role === "admin") {
    const { data: existing } = await supabase
      .from("supplier_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) return existing.id;

    const displayName =
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Tedarikçi";
    const orgName = sourcedFromText?.trim() || displayName;

    const { data: created, error } = await supabase
      .from("supplier_profiles")
      .insert({
        user_id: user.id,
        org_name: orgName,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return null;
    return created.id;
  }

  if (!sourcedFromText?.trim()) return null;

  const { data: match } = await supabase
    .from("supplier_profiles")
    .select("id")
    .eq("status", "published")
    .ilike("org_name", sourcedFromText.trim())
    .maybeSingle();

  return match?.id ?? null;
}

/** Match published supplier by name for purchase/location notes. */
export async function matchPublishedSupplierByName(
  supabase: SupabaseClient,
  name?: string,
): Promise<string | null> {
  if (!name?.trim()) return null;
  const { data } = await supabase
    .from("supplier_profiles")
    .select("id")
    .eq("status", "published")
    .ilike("org_name", name.trim())
    .maybeSingle();
  return data?.id ?? null;
}
