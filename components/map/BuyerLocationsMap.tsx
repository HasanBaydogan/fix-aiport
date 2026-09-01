"use client";

import dynamic from "next/dynamic";
import type { BuyerLocationPin } from "@/components/map/BuyerLocationsMapInner";

const BuyerLocationsMapInner = dynamic(
  () => import("@/components/map/BuyerLocationsMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-sm text-slate-500">
        Harita yükleniyor…
      </div>
    ),
  },
);

export function BuyerLocationsMap({ pins }: { pins: BuyerLocationPin[] }) {
  return <BuyerLocationsMapInner pins={pins} />;
}
