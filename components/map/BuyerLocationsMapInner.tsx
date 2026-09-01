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

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export type BuyerLocationPin = {
  id: string;
  lat: number;
  lng: number;
  label: string | null;
  product_name: string;
  notes: string | null;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function BuyerLocationsMapInner({
  pins,
}: {
  pins: BuyerLocationPin[];
}) {
  const center: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [41.0082, 28.9784];

  const clusterPins: ClusterPin[] = useMemo(
    () =>
      pins.map((pin) => ({
        id: pin.id,
        lat: pin.lat,
        lng: pin.lng,
        icon,
        popupHtml: `
          <div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.4">
            <p style="font-weight:600;margin:0 0 4px">${escapeHtml(pin.product_name)}</p>
            ${pin.label ? `<p style="margin:0 0 4px">${escapeHtml(pin.label)}</p>` : ""}
            ${pin.notes ? `<p style="color:#475569;margin:0">${escapeHtml(pin.notes)}</p>` : ""}
          </div>`,
      })),
    [pins],
  );

  return (
    <MapContainer center={center} zoom={11} className="h-72 w-full rounded-2xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClusteredMarkers pins={clusterPins} />
      <MapLocateControl />
    </MapContainer>
  );
}
