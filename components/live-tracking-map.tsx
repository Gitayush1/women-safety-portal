"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, Zap } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { MapMarker } from "./leaflet-map";

export function LiveTrackingMap() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 40.7589,
    lng: -73.9851,
  }); // fallback: Midtown Manhattan
  const [geoSupported, setGeoSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGeoSupported(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // keep fallback center
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      );
    }
  }, []);

  const trackedUsers = [
    {
      id: "user-001",
      name: "Sarah Johnson",
      status: "safe",
      location: { lat: 40.7128, lng: -74.006, address: "Downtown Market" },
      lastUpdate: "30 seconds ago",
      emergency: false,
    },
    {
      id: "user-002",
      name: "Maria Garcia",
      status: "emergency",
      location: { lat: 40.7589, lng: -73.9851, address: "Central Park Area" },
      lastUpdate: "5 seconds ago",
      emergency: true,
    },
    {
      id: "user-003",
      name: "Jennifer Lee",
      status: "safe",
      location: { lat: 40.7505, lng: -73.9934, address: "Times Square" },
      lastUpdate: "1 minute ago",
      emergency: false,
    },
    {
      id: "user-004",
      name: "Amanda Wilson",
      status: "warning",
      location: { lat: 40.7614, lng: -73.9776, address: "Upper East Side" },
      lastUpdate: "45 seconds ago",
      emergency: false,
    },
  ];

  const markers: MapMarker[] = useMemo(
    () =>
      trackedUsers.map((u) => ({
        id: u.id,
        label: u.name,
        position: u.location,
        address: u.location.address,
        status: (u.status as "safe" | "warning" | "unknown") || "unknown",
        emergency: u.emergency,
        lastUpdate: u.lastUpdate,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const DynamicLeafletMap = useMemo(
    () =>
      dynamic(() => import("./leaflet-map").then((m) => m.LeafletMap), {
        ssr: false,
      }),
    []
  );

  const getStatusColor = (status: string, emergency: boolean) => {
    if (emergency) return "bg-destructive text-destructive-foreground";
    switch (status) {
      case "safe":
        return "bg-green-600 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live Map View
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (geoSupported) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) =>
                      setCenter({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                      }),
                    () => setCenter(center) // no-op on error
                  );
                }
              }}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Center Map
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedUser((prev) => (prev ? null : prev));
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Auto Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <DynamicLeafletMap
            center={center}
            markers={markers}
            className="h-96 w-full rounded-lg border"
          />
          <div className="absolute top-4 left-4 space-y-2 bg-background/80 backdrop-blur-md p-3 rounded-lg border">
            {trackedUsers.map((user) => (
              <div
                key={user.id}
                className={`p-2 rounded-lg cursor-pointer transition-all ${
                  selectedUser === user.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() =>
                  setSelectedUser(selectedUser === user.id ? null : user.id)
                }
                role="button"
                aria-pressed={selectedUser === user.id}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      user.emergency
                        ? "bg-destructive animate-pulse"
                        : "bg-green-600"
                    }`}
                  />
                  <span className="text-sm font-medium">{user.name}</span>
                  <Badge
                    className={getStatusColor(user.status, user.emergency)}
                  >
                    {user.emergency ? "EMERGENCY" : user.status}
                  </Badge>
                </div>
                {selectedUser === user.id && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>{user.location.address}</p>
                    <p>Last update: {user.lastUpdate}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span>Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span>Emergency</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
