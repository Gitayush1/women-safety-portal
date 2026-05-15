"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation, Crosshair } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import type { MapMarker } from "./leaflet-map"

type TrackingViewMode = "all" | "emergency"

interface LiveTrackingMapProps {
  viewMode: TrackingViewMode
  refreshKey: number
}

export function LiveTrackingMap({ viewMode, refreshKey }: LiveTrackingMapProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 32.437867,
    lng: 77.577168,
  })
  const [geoSupported, setGeoSupported] = useState<boolean>(false)
  const [trackedUsers, setTrackedUsers] = useState<any[]>([])
  const [policeStations, setPoliceStations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGeoSupported(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      )
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading((prev) => (prev ? true : false))
      try {
        const usersEndpoint =
          viewMode === "emergency"
            ? "http://localhost:7777/api/tracking/emergency"
            : "http://localhost:7777/api/tracking/users"
        const usersResponse = await fetch(usersEndpoint, { credentials: "include" })
        const usersData = await usersResponse.json()

        if (usersResponse.ok) {
          const usersWithLocation = usersData.users
            .map((user: any) => {
              const status = (user.status || "unknown") as string
              const isEmergency = status === "emergency"
              const loc = user.lastLocation
              return {
                id: user._id,
                name: user.name,
                status,
                hasLocation: !!loc,
                location: loc
                  ? {
                      lat: loc.lat,
                      lng: loc.lng,
                      address: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
                    }
                  : null,
                lastUpdate: loc ? formatTimeAgo(loc.timestamp) : "No location",
                emergency: isEmergency,
              }
            })
          setTrackedUsers(usersWithLocation)
        } else {
          setTrackedUsers([])
        }

        const policeResponse = await fetch("http://localhost:7777/api/police/stations")
        const policeData = await policeResponse.json()

        if (policeResponse.ok) {
          const stationsWithLocation = policeData.policeStations
            .filter((s: any) => typeof s.latitude === "number" && typeof s.longitude === "number")
            .map((station: any) => ({
              id: station._id,
              name: station.policeStationName,
              badgeNumber: station.badgeNumber,
              location: {
                lat: station.latitude,
                lng: station.longitude,
                address: `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`,
              },
              type: "police",
            }))
          setPoliceStations(stationsWithLocation)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setTrackedUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [viewMode, refreshKey])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }

  const markers: MapMarker[] = useMemo(
    () => [
      ...trackedUsers
        .filter((u) => u.hasLocation && u.location)
        .map((u) => ({
          id: u.id,
          label: u.name,
          position: u.location,
          address: u.location.address,
          status: (u.status as "safe" | "warning" | "emergency" | "unknown") || "unknown",
          emergency: u.emergency,
          lastUpdate: u.lastUpdate,
          type: "user" as const,
        })),
      ...policeStations.map((station) => ({
        id: station.id,
        label: station.name,
        position: station.location,
        address: station.location.address,
        status: "safe" as const,
        emergency: false,
        lastUpdate: undefined,
        type: "police" as const,
      })),
    ],
    [trackedUsers, policeStations]
  )

  const DynamicLeafletMap = useMemo(
    () =>
      dynamic(() => import("./leaflet-map").then((m) => m.LeafletMap), {
        ssr: false,
      }),
    []
  )

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="font-semibold">Live Map View</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                if (geoSupported) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) =>
                      setCenter({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                      }),
                    () => {}
                  )
                }
              }}
            >
              <Crosshair className="h-3.5 w-3.5 mr-1" />
              Center
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="relative flex-1 min-h-0">
          <DynamicLeafletMap
            center={center}
            markers={markers}
            className="h-full w-full rounded-lg border border-border overflow-hidden"
          />

          {/* User overlay */}
          {trackedUsers.length > 0 && (
            <div className="absolute top-3 left-3 max-h-[300px] overflow-y-auto space-y-1.5 bg-card/90 backdrop-blur-md p-2.5 rounded-lg border border-border w-48">
              {trackedUsers.slice(0, 10).map((user) => (
                <div
                  key={user.id}
                  className={`p-1.5 rounded-md cursor-pointer transition-all text-xs ${
                    selectedUser === user.id
                      ? "ring-1 ring-primary bg-primary/10"
                      : "hover:bg-accent/50"
                  } ${!user.hasLocation ? "opacity-60" : ""}`}
                  onClick={() =>
                    setSelectedUser(selectedUser === user.id ? null : user.id)
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        user.emergency
                          ? "bg-red-500 animate-pulse-dot"
                          : user.status === "warning"
                          ? "bg-amber-500"
                          : user.hasLocation
                          ? "bg-emerald-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="font-medium truncate">{user.name}</span>
                  </div>
                  {selectedUser === user.id && (
                    <div className="mt-1 text-[10px] text-muted-foreground pl-3.5">
                      {user.hasLocation ? (
                        <>
                          <p>{user.location.address}</p>
                          <p>{user.lastUpdate}</p>
                        </>
                      ) : (
                        <p className="text-amber-500">No location data</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-dot" />
            <span>Emergency</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
