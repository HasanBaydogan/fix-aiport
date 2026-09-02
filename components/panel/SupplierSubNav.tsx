"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/panel/tedarikci", label: "Özet", exact: true },
  { href: "/panel/tedarikci/profil", label: "Profil" },
  { href: "/panel/tedarikci/urunler", label: "Ürünler" },
  { href: "/panel/tedarikci/pinler", label: "Harita pinleri" },
];

export function SupplierSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-brand-100 bg-brand-50/40 p-1.5 text-sm">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-xl px-3 py-1.5 font-medium transition ${
              active
                ? "bg-brand-600 text-white"
                : "text-brand-800 hover:bg-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
