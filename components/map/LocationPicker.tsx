"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { inputClass } from "@/lib/forms/types";

const MapClick = dynamic(() => import("@/components/map/MapClickInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-sm text-slate-500">
      Harita yükleniyor…
    </div>
  ),
});

export function LocationPicker({ optional = false }: { optional?: boolean }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {optional
          ? "İsteğe bağlı: nereden aldığınızı haritada işaretleyin."
          : "Haritaya tıklayın veya konumumu kullanın. Pin sürükleyebilirsiniz."}
      </p>
      <MapClick
        lat={lat ? Number(lat) : null}
        lng={lng ? Number(lng) : null}
        onPick={(la, ln) => {
          setLat(String(la));
          setLng(String(ln));
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-900">Enlem</label>
          <input
            name="lat"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className={inputClass(false)}
            required={!optional}
            readOnly
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-900">Boylam</label>
          <input
            name="lng"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className={inputClass(false)}
            required={!optional}
            readOnly
          />
        </div>
      </div>
      <button
        type="button"
        className="rounded-xl border border-brand-200 px-3 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50"
        onClick={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition((pos) => {
            setLat(String(pos.coords.latitude));
            setLng(String(pos.coords.longitude));
          });
        }}
      >
        Konumumu kullan
      </button>
    </div>
  );
}
