"use client"

import * as React from "react"
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps"

type LatLng = { lat: number; lng: number }

export type TrackedUser = {
  id: string
  name?: string
  position: LatLng
  status?: "safe" | "warning" | "emergency"
  note?: string
}

type GoogleTrackingMapProps = {
  apiKey?: string
  center?: LatLng
  zoom?: number
  users?: TrackedUser[]
  className?: string
  height?: number // in vh
}

const statusToColor = (status?: TrackedUser["status"]) => {
  switch (status) {
    case "safe":
      return { background: "#22c55e", border: "#15803d" } // green
    case "warning":
      return { background: "#eab308", border: "#a16207" } // yellow
    case "emergency":
      return { background: "#ef4444", border: "#991b1b" } // red
    default:
      return { background: "#3b82f6", border: "#1d4ed8" } // blue default
  }
}

export default function GoogleTrackingMap({
  apiKey,
  center,
  zoom = 13,
  users = [],
  className = "",
  height = 70,
}: GoogleTrackingMapProps) {
  const [mapCenter, setMapCenter] = React.useState<LatLng>(center || { lat: 28.6139, lng: 77.209 }) // New Delhi fallback
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (center) return
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 },
      )
    }
  }, [center])

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div>
          <p className="font-medium">Google Maps API key missing</p>
          <p className="text-sm text-muted-foreground">
            Please add a Google Maps API key in Project Settings. This page will pass it from the server.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={{ height: `${height}vh` }}>
      <APIProvider apiKey={apiKey}>
        <Map defaultZoom={zoom} defaultCenter={mapCenter} gestureHandling="greedy" disableDefaultUI={false}>
          {users.map((u) => {
            const { background, border } = statusToColor(u.status)
            return (
              <AdvancedMarker key={u.id} position={u.position} onClick={() => setSelectedId(u.id)}>
                <Pin background={background} borderColor={border} glyphColor="#fff" />
              </AdvancedMarker>
            )
          })}

          {users.map((u) =>
            selectedId === u.id ? (
              <InfoWindow key={`info-${u.id}`} position={u.position} onCloseClick={() => setSelectedId(null)}>
                <div className="min-w-40">
                  <p className="font-medium">{u.name || "Tracked User"}</p>
                  <p className="text-xs text-muted-foreground">Status: {u.status || "unknown"}</p>
                  {u.note ? <p className="mt-1 text-xs">{u.note}</p> : null}
                </div>
              </InfoWindow>
            ) : null,
          )}
        </Map>
      </APIProvider>
    </div>
  )
}
