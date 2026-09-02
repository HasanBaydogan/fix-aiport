import Image from "next/image";
import Link from "next/link";
import { NavLink } from "@/components/layout/NavLink";
import { PanelNavGroup } from "@/components/layout/PanelNavGroup";
import type { AppRole } from "@/lib/supabase/database.types";
import { roleLabel } from "@/lib/auth/roles";
import { buttonCompactClass } from "@/lib/ui/classes";

const publicLinks = [
  { href: "/urunler", label: "Ürünler" },
  { href: "/harita", label: "Harita" },
  { href: "/tamirat", label: "Tamirat" },
];

export function SiteHeader({
  userEmail,
  role,
}: {
  userEmail?: string | null;
  role?: AppRole | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="FiX Ai"
            width={969}
            height={445}
            className="h-8 w-auto sm:h-10"
            priority
          />
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {publicLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
          {userEmail ? (
            <>
              <NavLink href="/panel">Panel</NavLink>
              <span className="hidden text-xs text-slate-500 sm:inline">
                {roleLabel(role ?? "buyer")} · {userEmail}
              </span>
            </>
          ) : (
            <Link href="/giris" className={buttonCompactClass}>
              Giriş
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-white/60 px-4 py-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-8 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-brand-900">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/urunler" className="hover:text-brand-600">
                Ürün kataloğu
              </Link>
            </li>
            <li>
              <Link href="/harita" className="hover:text-brand-600">
                Malzeme & tedarik haritası
              </Link>
            </li>
            <li>
              <Link href="/tamirat" className="hover:text-brand-600">
                Tamirat talebi
              </Link>
            </li>
            <li>
              <Link href="/panel" className="hover:text-brand-600">
                Şantiye paneli
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-brand-900">Bilgi</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Global içerikler admin onayından sonra yayınlanır. Kişisel veriler yalnızca
            onaylı tedarikçi profillerinde public alanlarda görünür (R4).
          </p>
        </div>
        <div className="text-sm text-slate-500 sm:text-right">
          <p>
            Coded By <span className="font-semibold text-brand-700">AiPORT</span>
          </p>
          <p className="mt-2 text-xs">FiX Ai · Şantiye, malzeme ve tedarik platformu</p>
        </div>
      </div>
    </footer>
  );
}

export function PanelNav({ role }: { role: AppRole }) {
  const showSupplier = role === "supplier" || role === "admin";
  const showAdmin = role === "admin";

  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-brand-100 bg-white p-2 text-sm">
      <NavLink href="/panel" exact variant="panel">
        Özet
      </NavLink>

      <PanelNavGroup
        label="Şantiye"
        items={[
          { href: "/panel/gunluk", label: "Günlük" },
          { href: "/panel/santiyeler", label: "Şantiyelerim" },
          { href: "/panel/depolar", label: "Depolarım" },
        ]}
      />

      <PanelNavGroup
        label="Malzeme"
        items={[
          { href: "/panel/stok", label: "Stok" },
          { href: "/panel/satin-alimlar", label: "Satın alımlarım" },
          { href: "/panel/satin-alinacaklar", label: "Satın alınacaklar" },
        ]}
      />

      <PanelNavGroup
        label="Katalog"
        items={[
          { href: "/panel/urun-ekle", label: "Ürün ekle" },
          { href: "/panel/konumlar", label: "Ürün konumlarım" },
          { href: "/harita", label: "Harita" },
        ]}
      />

      {showSupplier ? (
        <NavLink href="/panel/tedarikci" variant="panel">
          Tedarikçi
        </NavLink>
      ) : null}

      {showAdmin ? (
        <PanelNavGroup
          label="Admin"
          variant="admin"
          items={[
            { href: "/panel/admin", label: "Moderasyon" },
            { href: "/panel/kategoriler", label: "Kategoriler" },
          ]}
        />
      ) : null}
    </nav>
  );
}
