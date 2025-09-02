"use client"

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect } from "react"

type LatLng = { lat: number; lng: number }

export type MapMarker = {
  id: string
  position: LatLng
  label: string
  address?: string
  status: "safe" | "warning" | "unknown"
  emergency?: boolean
  lastUpdate?: string
}

function RecenterOnChange({ center }: { center: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom() || 13, { animate: true })
  }, [center, map])
  return null
}

export function LeafletMap({
  center,
  markers,
  className,
}: {
  center: LatLng
  markers: MapMarker[]
  className?: string
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
              : "#64748b"
        const radius = m.emergency ? 10 : 7
        return (
          <CircleMarker
            key={m.id}
            center={[m.position.lat, m.position.lng]}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}
            radius={radius}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-medium">{m.label}</p>
                {m.address ? <p className="text-sm text-muted-foreground">{m.address}</p> : null}
                {m.lastUpdate ? <p className="text-xs text-muted-foreground">Last update: {m.lastUpdate}</p> : null}
                {m.emergency ? <p className="text-xs text-red-600 font-semibold">EMERGENCY</p> : null}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
