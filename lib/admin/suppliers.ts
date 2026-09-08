"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/roles";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/supabase/database.types";

function revalidateSupplierAdminPaths(profileId?: string) {
  revalidatePath("/panel/admin");
  revalidatePath("/panel/admin/tedarikciler");
  revalidatePath("/panel/admin/uyeler");
  revalidatePath("/panel/tedarikci");
  revalidatePath("/panel/tedarikci/profil");
  revalidatePath("/harita");
  if (profileId) {
    revalidatePath(`/panel/admin/tedarikciler/${profileId}`);
    revalidatePath(`/tedarikci/${profileId}`);
  }
}

async function setUserRole(userId: string, role: AppRole) {
  const admin = createServiceClient();
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (authError) throw new Error(authError.message);

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);
}

export async function adminCreateSupplier(formData: FormData) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { error: "Admin gerekli." };
  }
  if (!isServiceRoleConfigured()) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY gerekli." };
  }

  const org_name = String(formData.get("org_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const public_phone = String(formData.get("public_phone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const category_focus = String(formData.get("category_focus") ?? "").trim();
  const ownerMode = String(formData.get("owner_mode") ?? "existing").trim();
  const existingUserId = String(formData.get("user_id") ?? "").trim();
  const inviteEmail = String(formData.get("invite_email") ?? "").trim().toLowerCase();

  if (!org_name) return { error: "Ticari unvan zorunludur." };

  const admin = createServiceClient();
  let ownerId: string;

  if (ownerMode === "invite") {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      return { error: "Geçerli bir davet e-postası girin." };
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(inviteEmail, {
        data: {},
        redirectTo: `${siteUrl}/giris`,
      });

    if (inviteError || !invited.user) {
      // Kullanıcı zaten varsa e-posta ile bul
      const { data: listed } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existing = listed?.users.find(
        (u) => u.email?.toLowerCase() === inviteEmail,
      );
      if (!existing) {
        return { error: inviteError?.message ?? "Davet gönderilemedi." };
      }
      ownerId = existing.id;
    } else {
      ownerId = invited.user.id;
    }
  } else {
    if (!existingUserId) return { error: "Sahip kullanıcı seçin." };
    ownerId = existingUserId;

    const { data: profile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", ownerId)
      .maybeSingle();

    if (!profile) return { error: "Kullanıcı bulunamadı." };
    if (profile.role === "admin") {
      return { error: "Admin hesabına tedarikçi firması atanamaz." };
    }
  }

  const { data: existingSp } = await admin
    .from("supplier_profiles")
    .select("id, status")
    .eq("user_id", ownerId)
    .maybeSingle();

  if (existingSp && existingSp.status !== "archived") {
    return { error: "Bu kullanıcının zaten bir tedarikçi profili var." };
  }

  try {
    await setUserRole(ownerId, "supplier");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Rol atanamadı." };
  }

  if (existingSp?.status === "archived") {
    const { data: revived, error: reviveError } = await admin
      .from("supplier_profiles")
      .update({
        org_name,
        city: city || null,
        district: district || null,
        public_phone: public_phone || null,
        website: website || null,
        category_focus: category_focus || null,
        kvkk_consent_at: null,
        status: "pending",
        moderation_note: null,
      })
      .eq("id", existingSp.id)
      .select("id")
      .single();

    if (reviveError) return { error: reviveError.message };
    revalidateSupplierAdminPaths(revived.id);
    return {
      ok: true,
      message: "Tedarikçi firması yeniden oluşturuldu (pending).",
      profileId: revived.id,
    };
  }

  const { data: created, error: insertError } = await admin
    .from("supplier_profiles")
    .insert({
      user_id: ownerId,
      org_name,
      city: city || null,
      district: district || null,
      public_phone: public_phone || null,
      website: website || null,
      category_focus: category_focus || null,
      kvkk_consent_at: null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  revalidateSupplierAdminPaths(created.id);
  return {
    ok: true,
    message:
      ownerMode === "invite"
        ? "Davet gönderildi ve firma oluşturuldu (pending)."
        : "Tedarikçi firması oluşturuldu (pending).",
    profileId: created.id,
  };
}
