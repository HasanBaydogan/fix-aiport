"use client";

import dynamic from "next/dynamic";
import type { GlobalMapPin } from "@/components/map/GlobalMapInner";

const GlobalMapInner = dynamic(() => import("@/components/map/GlobalMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-3xl border border-brand-100 bg-white text-slate-500">
      Harita yükleniyor…
    </div>
  ),
});

export function GlobalMap({
  pins,
  isLoggedIn,
}: {
  pins: GlobalMapPin[];
  isLoggedIn: boolean;
}) {
  return <GlobalMapInner pins={pins} isLoggedIn={isLoggedIn} />;
}
