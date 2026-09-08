"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSetUserRole } from "@/lib/admin/users";
import type { AppRole } from "@/lib/supabase/database.types";
import { buttonCompactClass } from "@/lib/ui/classes";

function labelFor(role: AppRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "supplier":
      return "Tedarikçi";
    default:
      return "Alıcı";
  }
}

export function AdminRoleForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: AppRole;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<AppRole>(
    currentRole === "supplier" ? "buyer" : currentRole,
  );

  const options: AppRole[] =
    currentRole === "supplier" ? ["buyer"] : ["buyer", "admin"];

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setMessage(null);
        setError(null);
        start(async () => {
          const result = await adminSetUserRole(fd);
          if (result.error) setError(result.error);
          else {
            setMessage(result.message ?? "Güncellendi.");
            router.refresh();
          }
        });
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
          Rol
        </label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as AppRole)}
          className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-xs"
          disabled={pending}
        >
          {options.map((r) => (
            <option key={r} value={r}>
              {labelFor(r)}
            </option>
          ))}
        </select>
      </div>
      {role === "admin" && currentRole !== "admin" ? (
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input type="checkbox" name="confirm_admin" />
          Admin onay
        </label>
      ) : null}
      <button type="submit" disabled={pending} className={buttonCompactClass}>
        {pending ? "…" : "Kaydet"}
      </button>
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
      {message ? <p className="w-full text-xs text-emerald-700">{message}</p> : null}
      {currentRole === "supplier" ? (
        <p className="w-full text-[11px] text-slate-500">
          Tedarikçiyi alıcıya düşürmek firmayı arşivler. Yeni tedarikçi ataması Tedarikçiler
          sayfasından yapılır.
        </p>
      ) : null}
    </form>
  );
}
