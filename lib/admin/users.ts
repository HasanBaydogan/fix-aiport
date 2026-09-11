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
  revalidatePath("/panel/admin/uyeler");
  revalidatePath("/panel/admin/tedarikciler");
}

/** Yalnızca ihtiyaç duyulan kullanıcılar için e-posta — tam listUsers yok */
export async function getEmailsByUserIds(
  userIds: string[],
): Promise<Map<string, string | null>> {
  const emailById = new Map<string, string | null>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0 || !isServiceRoleConfigured()) return emailById;

  const admin = createServiceClient();
  const chunkSize = 8;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (id) => {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error || !data.user) return [id, null] as const;
        return [id, data.user.email ?? null] as const;
      }),
    );
    for (const [id, email] of results) emailById.set(id, email);
  }
  return emailById;
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

  const [{ data: profiles, error }, { data: supplierProfiles }] =
    await Promise.all([
      query,
      session.supabase
        .from("supplier_profiles")
        .select("id, user_id, org_name")
        .neq("status", "archived"),
    ]);

  if (error) return { error: error.message };

  const supplierByUser = new Map(
    (supplierProfiles ?? []).map((sp) => [sp.user_id, sp]),
  );

  const emailById = await getEmailsByUserIds((profiles ?? []).map((p) => p.id));

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

  if (target.role === "supplier") {
    return {
      error:
        "Tedarikçi rolü buradan değiştirilemez. Yönetim Tedarikçiler sayfasından yapılır.",
    };
  }

  if (target.role === nextRole) {
    return { ok: true, message: `Rol zaten ${roleLabel(nextRole)}.` };
  }

  if (nextRole === "admin" && !confirmAdmin) {
    return { error: "Admin yükseltmesi için onay kutusunu işaretleyin." };
  }

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

  const [{ data: profiles, error }, { data: existingOwners }] = await Promise.all([
    session.supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("role", "buyer")
      .order("display_name"),
    session.supabase
      .from("supplier_profiles")
      .select("user_id")
      .neq("status", "archived"),
  ]);

  if (error) return { error: error.message };

  const owned = new Set((existingOwners ?? []).map((o) => o.user_id));
  const candidates = (profiles ?? []).filter((p) => !owned.has(p.id));
  const emailById = await getEmailsByUserIds(candidates.map((p) => p.id));

  const buyers = candidates.map((p) => ({
    id: p.id,
    display_name: p.display_name,
    email: emailById.get(p.id) ?? null,
  }));

  return { buyers };
}
