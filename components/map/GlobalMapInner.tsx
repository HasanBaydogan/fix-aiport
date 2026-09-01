"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";
import {
  ClusteredMarkers,
  MapLocateControl,
  type ClusterPin,
} from "@/components/map/MapClusterLayer";
import "leaflet/dist/leaflet.css";

const supplierIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const productIconCache = new Map<string, L.DivIcon>();

function productIcon(color: string): L.DivIcon {
  const cached = productIconCache.get(color);
  if (cached) return cached;
  const icon = L.divIcon({
    className: "",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  productIconCache.set(color, icon);
  return icon;
}

export type GlobalMapPin = {
  id: string;
  lat: number;
  lng: number;
  kind: "supplier" | "product";
  title: string;
  subtitle?: string | null;
  linkHref: string;
  pinColor?: string;
  categoryLabel?: string | null;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function GlobalMapInner({
  pins,
  isLoggedIn,
}: {
  pins: GlobalMapPin[];
  isLoggedIn: boolean;
}) {
  const center: [number, number] = useMemo(() => {
    if (pins.length === 0) return [41.0082, 28.9784];
    const lat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
    const lng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
    return [lat, lng];
  }, [pins]);

  const clusterPins: ClusterPin[] = useMemo(
    () =>
      pins.map((pin) => {
        const kindLabel = pin.kind === "supplier" ? "Tedarikçi" : "Ürün konumu";
        const linkLabel = isLoggedIn ? "Detay" : "Detay için giriş yapın";
        const linkHref = isLoggedIn ? pin.linkHref : "/giris";
        const popupHtml = `
          <div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.4">
            <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;margin:0 0 4px">${escapeHtml(kindLabel)}</p>
            ${pin.categoryLabel ? `<p style="font-size:11px;color:#64748b;margin:0 0 4px">${escapeHtml(pin.categoryLabel)}</p>` : ""}
            <p style="font-weight:600;margin:0 0 4px">${escapeHtml(pin.title)}</p>
            ${pin.subtitle ? `<p style="margin:0 0 4px">${escapeHtml(pin.subtitle)}</p>` : ""}
            <a href="${escapeHtml(linkHref)}" style="color:#1b6fe0">${escapeHtml(linkLabel)}</a>
          </div>`;
        return {
          id: `${pin.kind}-${pin.id}`,
          lat: pin.lat,
          lng: pin.lng,
          icon:
            pin.kind === "supplier"
              ? supplierIcon
              : productIcon(pin.pinColor ?? "#1557b8"),
          popupHtml,
        };
      }),
    [pins, isLoggedIn],
  );

  return (
    <MapContainer center={center} zoom={10} className="h-[480px] w-full rounded-3xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClusteredMarkers pins={clusterPins} />
      <MapLocateControl />
    </MapContainer>
  );
}
