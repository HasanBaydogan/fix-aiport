export function ServiceRoleBanner() {
  if (isServiceRoleConfigured()) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">SUPABASE_SERVICE_ROLE_KEY eksik</p>
      <p className="mt-1 text-amber-800">
        Tedarikçi rol başvurusu onayı çalışmaz. Supabase Dashboard → Project Settings →
        API → <code className="text-xs">service_role</code> anahtarını{" "}
        <code className="text-xs">.env.local</code> dosyasına ekleyin ve sunucuyu yeniden
        başlatın.
      </p>
    </div>
  );
}

function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
