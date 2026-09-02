"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  exact = false,
  variant = "header",
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  variant?: "header" | "panel" | "admin" | "panel-menu" | "admin-menu";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || (href !== "/panel" && pathname.startsWith(`${href}/`));

  const isMenu = variant === "panel-menu" || variant === "admin-menu";
  const isAdmin = variant === "admin" || variant === "admin-menu";

  const base = isMenu
    ? "block rounded-lg px-3 py-2 text-sm font-medium transition"
    : "rounded-xl px-3 py-2 font-medium transition";

  const activeClass = isAdmin
    ? isMenu
      ? "bg-red-50 text-red-700"
      : "bg-red-50 text-red-700"
    : variant === "panel" || variant === "panel-menu"
      ? isMenu
        ? "bg-brand-50 text-brand-700"
        : "bg-brand-100 text-brand-700"
      : "bg-brand-50 text-brand-700";

  const idleClass = isAdmin
    ? "text-red-600 hover:bg-red-50"
    : "text-brand-900 hover:bg-brand-50";

  return (
    <Link
      href={href}
      role={isMenu ? "menuitem" : undefined}
      className={`${base} ${active ? activeClass : idleClass}`}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}
