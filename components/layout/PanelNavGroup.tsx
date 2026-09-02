"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/layout/NavLink";

export type PanelNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

function pathMatches(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || (href !== "/panel" && pathname.startsWith(`${href}/`));
}

export function PanelNavGroup({
  label,
  items,
  variant = "panel",
}: {
  label: string;
  items: PanelNavItem[];
  variant?: "panel" | "admin";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const active = items.some((item) => pathMatches(pathname, item.href, item.exact));

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const base = "rounded-xl px-3 py-2 font-medium transition";
  const activeClass =
    variant === "admin" ? "bg-red-50 text-red-700" : "bg-brand-100 text-brand-700";
  const idleClass =
    variant === "admin" ? "text-red-600 hover:bg-red-50" : "text-brand-900 hover:bg-brand-50";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`${base} inline-flex items-center gap-1 ${active || open ? activeClass : idleClass}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <span aria-hidden="true" className="text-[0.65rem] opacity-70">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 z-50 mt-1 min-w-[12rem] rounded-xl border border-brand-100 bg-white p-1 shadow-lg shadow-brand-900/10"
        >
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              variant={variant === "admin" ? "admin-menu" : "panel-menu"}
              onNavigate={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
