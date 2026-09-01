"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "@/components/map/SupplierMapInner";

const SupplierMapInner = dynamic(() => import("@/components/map/SupplierMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-3xl border border-brand-100 bg-white text-slate-500">
      Harita yükleniyor…
    </div>
  ),
});

export function SupplierMap({
  pins,
  isLoggedIn,
}: {
  pins: MapPin[];
  isLoggedIn: boolean;
}) {
  return <SupplierMapInner pins={pins} isLoggedIn={isLoggedIn} />;
}
