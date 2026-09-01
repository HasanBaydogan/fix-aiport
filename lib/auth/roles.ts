import type { AppRole } from "@/lib/supabase/database.types";

export function roleFromClaims(
  appMetadata: Record<string, unknown> | undefined | null,
): AppRole {
  const role = appMetadata?.role;
  if (role === "admin" || role === "supplier" || role === "buyer") {
    return role;
  }
  return "buyer";
}

export async function getSessionUser() {
  const { createClient, hasSupabaseEnv } = await import("@/lib/supabase/server");
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const role = roleFromClaims(
    user.app_metadata as Record<string, unknown> | undefined,
  );

  return { user, role, supabase };
}

export async function requireUser() {
  const session = await getSessionUser();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Admin always passes. Otherwise role must be in `allowed`. */
export async function requireRole(allowed: AppRole[]) {
  const session = await requireUser();
  if (session.role === "admin" || allowed.includes(session.role)) {
    return session;
  }
  throw new Error("FORBIDDEN");
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "supplier":
      return "Tedarikçi";
    default:
      return "Alıcı";
  }
}
