"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  position: LatLng;
  label: string;
  address?: string;
  status: "safe" | "warning" | "unknown";
  emergency?: boolean;
  lastUpdate?: string;
};

function RecenterOnChange({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom() || 13, {
      animate: true,
    });
  }, [center, map]);
  return null;
}

export function LeafletMap({
  center,
  markers,
  className,
}: {
  center: LatLng;
  markers: MapMarker[];
  className?: string;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className={className || "h-96 w-full rounded-lg"}
      scrollWheelZoom
      style={{ outline: "none" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnChange center={center} />
      {markers.map((m) => {
        const color = m.emergency
          ? "#ef4444"
          : m.status === "safe"
          ? "#16a34a"
          : m.status === "warning"
          ? "#eab308"
          : "#64748b";
        const radius = m.emergency ? 10 : 7;
        return (
          <CircleMarker
            key={m.id}
            center={[m.position.lat, m.position.lng]}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}
            radius={radius}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="space-y-1 text-center">
                <p className="font-semibold text-sm">{m.label}</p>
                <p className="text-xs text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      m.emergency
                        ? "text-red-600"
                        : m.status === "safe"
                        ? "text-green-600"
                        : m.status === "warning"
                        ? "text-yellow-600"
                        : "text-gray-600"
                    }`}
                  >
                    {m.emergency ? "EMERGENCY" : m.status.toUpperCase()}
                  </span>
                </p>
                {m.address && (
                  <p className="text-xs text-gray-500">{m.address}</p>
                )}
                {m.lastUpdate && (
                  <p className="text-xs text-gray-400">
                    Last update: {m.lastUpdate}
                  </p>
                )}
              </div>
            </Tooltip>
            <Popup>
              <div className="space-y-1">
                <p className="font-medium">{m.label}</p>
                {m.address ? (
                  <p className="text-sm text-muted-foreground">{m.address}</p>
                ) : null}
                {m.lastUpdate ? (
                  <p className="text-xs text-muted-foreground">
                    Last update: {m.lastUpdate}
                  </p>
                ) : null}
                {m.emergency ? (
                  <p className="text-xs text-red-600 font-semibold">
                    EMERGENCY
                  </p>
                ) : null}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
