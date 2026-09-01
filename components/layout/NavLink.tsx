"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  exact = false,
  variant = "header",
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  variant?: "header" | "panel" | "admin";
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || (href !== "/panel" && pathname.startsWith(`${href}/`));

  const base = "rounded-xl px-3 py-2 font-medium transition";
  const activeClass =
    variant === "admin"
      ? "bg-red-50 text-red-700"
      : variant === "panel"
        ? "bg-brand-100 text-brand-700"
        : "bg-brand-50 text-brand-700";
  const idleClass =
    variant === "admin"
      ? "text-red-600 hover:bg-red-50"
      : "text-brand-900 hover:bg-brand-50";

  return (
    <Link href={href} className={`${base} ${active ? activeClass : idleClass}`}>
      {children}
    </Link>
  );
}
