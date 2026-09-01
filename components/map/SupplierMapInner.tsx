"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string | null;
  org_name: string;
  city: string | null;
  supplier_profile_id: string;
};

export default function SupplierMapInner({
  pins,
  isLoggedIn,
}: {
  pins: MapPin[];
  isLoggedIn: boolean;
}) {
  const center: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [41.0082, 28.9784];

  return (
    <MapContainer center={center} zoom={10} className="h-[480px] w-full rounded-3xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={icon}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{pin.org_name}</p>
              {pin.label ? <p>{pin.label}</p> : null}
              {pin.city ? <p className="text-slate-600">{pin.city}</p> : null}
              {isLoggedIn ? (
                <Link
                  href={`/tedarikci/${pin.supplier_profile_id}`}
                  className="text-brand-600 underline"
                >
                  Profil / değerlendirme
                </Link>
              ) : (
                <Link href="/giris" className="text-brand-600 underline">
                  Fiyat ve puan için giriş yapın
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
