"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export function MapLocateControl() {
  const map = useMap();

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
        map.setView(latlng, 14);
        L.circleMarker(latlng, {
          radius: 8,
          color: "#1b6fe0",
          fillColor: "#2f8dff",
          fillOpacity: 0.85,
          weight: 2,
        })
          .addTo(map)
          .bindPopup("Konumunuz")
          .openPopup();
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    const control = new L.Control({ position: "topright" });
    control.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar");
      const btn = L.DomUtil.create("button", "", div) as HTMLButtonElement;
      btn.type = "button";
      btn.title = "Konumuma git";
      btn.innerHTML = "◎";
      btn.style.cssText =
        "width:34px;height:34px;line-height:34px;font-size:18px;background:#fff;border:none;cursor:pointer";
      L.DomEvent.disableClickPropagation(btn);
      L.DomEvent.on(btn, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        locate();
      });
      return div;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

export type ClusterPin = {
  id: string;
  lat: number;
  lng: number;
  icon: L.Icon | L.DivIcon;
  popupHtml: string;
};

export function ClusteredMarkers({ pins }: { pins: ClusterPin[] }) {
  const map = useMap();

  useEffect(() => {
    const cluster = L.markerClusterGroup();
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], { icon: pin.icon });
      marker.bindPopup(pin.popupHtml);
      cluster.addLayer(marker);
    }
    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, pins]);

  return null;
}
