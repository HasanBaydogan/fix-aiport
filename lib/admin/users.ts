"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, roleLabel } from "@/lib/auth/roles";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/supabase/database.types";

export type AdminMemberRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: AppRole;
  created_at: string;
  supplier_profile_id: string | null;
  supplier_org_name: string | null;
};

function revalidateAdminMemberPaths() {
  revalidatePath("/panel/admin");
  revalidatePath("/panel/admin/uyeler");
  revalidatePath("/panel/admin/tedarikciler");
  revalidatePath("/panel");
  revalidatePath("/panel/tedarikci");
}

export async function listAdminMembers(roleFilter?: AppRole | "all"): Promise<{
  error?: string;
  members?: AdminMemberRow[];
}> {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { error: "Admin gerekli." };
  }
  if (!isServiceRoleConfigured()) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY gerekli." };
  }

  let query = session.supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false });

  if (roleFilter && roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  const { data: profiles, error } = await query;
  if (error) return { error: error.message };

  const { data: supplierProfiles } = await session.supabase
    .from("supplier_profiles")
    .select("id, user_id, org_name")
    .neq("status", "archived");

  const supplierByUser = new Map(
    (supplierProfiles ?? []).map((sp) => [sp.user_id, sp]),
  );

  const admin = createServiceClient();
  const emailById = new Map<string, string | null>();

  // Paginate auth users for email lookup
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (listError) return { error: listError.message };
    for (const u of data.users) {
      emailById.set(u.id, u.email ?? null);
    }
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }

  const members: AdminMemberRow[] = (profiles ?? []).map((p) => {
    const sp = supplierByUser.get(p.id);
    return {
      id: p.id,
      email: emailById.get(p.id) ?? null,
      display_name: p.display_name,
      role: p.role as AppRole,
      created_at: p.created_at,
      supplier_profile_id: sp?.id ?? null,
      supplier_org_name: sp?.org_name ?? null,
    };
  });

  return { members };
}

export async function adminSetUserRole(formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { error: "Admin gerekli." };
  }
  if (!isServiceRoleConfigured()) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY gerekli." };
  }

  const userId = String(formData.get("user_id") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "").trim() as AppRole;
  const confirmAdmin = formData.get("confirm_admin") === "on";

  if (!userId) return { error: "Kullanıcı gerekli." };
  if (nextRole !== "buyer" && nextRole !== "admin") {
    return {
      error:
        "Tedarikçi rolü yalnızca Tedarikçiler sayfasından firma oluşturarak atanır.",
    };
  }

  const { data: target } = await session.supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!target) return { error: "Kullanıcı bulunamadı." };

  if (target.role === nextRole) {
    return { ok: true, message: `Rol zaten ${roleLabel(nextRole)}.` };
  }

  if (nextRole === "admin" && !confirmAdmin) {
    return { error: "Admin yükseltmesi için onay kutusunu işaretleyin." };
  }

  // Son admin'i düşürmeyi engelle
  if (target.role === "admin" && nextRole !== "admin") {
    const { count } = await session.supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return { error: "Son admin düşürülemez." };
    }
    if (userId === session.user.id) {
      return { error: "Kendi admin rolünüzü bu ekrandan düşüremezsiniz." };
    }
  }

  const admin = createServiceClient();

  // supplier → buyer: arşivle profil
  if (target.role === "supplier" && nextRole === "buyer") {
    await admin
      .from("supplier_profiles")
      .update({ status: "archived" })
      .eq("user_id", userId)
      .neq("status", "archived");
  }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: nextRole },
  });
  if (authError) return { error: authError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: nextRole })
    .eq("id", userId);
  if (profileError) return { error: profileError.message };

  revalidateAdminMemberPaths();
  return {
    ok: true,
    message: `Rol ${roleLabel(nextRole)} olarak güncellendi.`,
  };
}

/** Buyer listesi — tedarikçi atama formu için */
export async function listBuyerCandidates(): Promise<{
  error?: string;
  buyers?: Array<{ id: string; display_name: string | null; email: string | null }>;
}> {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { error: "Admin gerekli." };
  }
  if (!isServiceRoleConfigured()) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY gerekli." };
  }

  const { data: profiles, error } = await session.supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("role", "buyer")
    .order("display_name");

  if (error) return { error: error.message };

  const { data: existingOwners } = await session.supabase
    .from("supplier_profiles")
    .select("user_id")
    .neq("status", "archived");

  const owned = new Set((existingOwners ?? []).map((o) => o.user_id));

  const admin = createServiceClient();
  const emailById = new Map<string, string | null>();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (listError) return { error: listError.message };
    for (const u of data.users) {
      emailById.set(u.id, u.email ?? null);
    }
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }

  const buyers = (profiles ?? [])
    .filter((p) => !owned.has(p.id))
    .map((p) => ({
      id: p.id,
      display_name: p.display_name,
      email: emailById.get(p.id) ?? null,
    }));

  return { buyers };
}
