import Link from "next/link";
import { getSessionUser, roleLabel } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { buttonCompactClass } from "@/lib/ui/classes";

export default async function PanelHomePage() {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel");
  const supabase = session.supabase;

  const [{ count: sites }, { count: products }, { data: pendingReq }] =
    await Promise.all([
      supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .is("archived_at", null),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("created_by", session.user.id),
      supabase
        .from("role_requests")
        .select("id, status")
        .eq("user_id", session.user.id)
        .eq("status", "pending")
        .maybeSingle(),
    ]);

  const quickActions = [
    { href: "/panel/santiyeler", label: "Şantiye ekle", desc: "Yeni proje oluştur" },
    { href: "/panel/stok", label: "Stok kaydı", desc: "Malzeme girişi" },
    { href: "/panel/satin-alimlar", label: "Satın alma", desc: "Alım kaydet" },
    { href: "/panel/konumlar", label: "Konum işaretle", desc: "Harita için" },
    { href: "/panel/urun-ekle", label: "Ürün ekle", desc: "Global katalog" },
    { href: "/harita", label: "Haritayı gör", desc: "Tedarik keşfi" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Özet"
        title={`Merhaba, ${roleLabel(session.role)}`}
        description="Şantiyelerinizi yönetin, stok ve satın alma kayıtlarını tutun. Global içerikler admin onayından sonra yayınlanır."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Şantiyelerim" value={sites ?? 0} href="/panel/santiyeler" hint="Yönet →" />
        <StatTile label="Ürünlerim" value={products ?? 0} href="/panel/urun-ekle" hint="Görüntüle →" />
        <StatTile
          label="Rolünüz"
          value={roleLabel(session.role)}
          href={session.role === "admin" ? "/panel/admin" : "/panel/tedarikci"}
        />
      </div>

      <div>
        <h3 className="font-semibold text-brand-900">Hızlı işlemler</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl border border-brand-100 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/50"
            >
              <p className="font-medium text-brand-900">{action.label}</p>
              <p className="text-xs text-slate-500">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {session.role === "buyer" && !pendingReq ? (
        <form action="/api/role-request" method="post" className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
          <p className="text-sm text-slate-700">
            Tedarikçi misiniz? Public profil ve harita pini için rol başvurusu yapın (R2).
          </p>
          <button type="submit" className={`${buttonCompactClass} mt-3`}>
            Tedarikçi olmak istiyorum
          </button>
        </form>
      ) : null}

      {pendingReq ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tedarikçi rol başvurunuz inceleniyor. Onay sonrası tedarikçi paneli açılacaktır.
        </p>
      ) : null}
    </div>
  );
}
