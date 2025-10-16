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
    lat: 32.437867,
    lng: 77.577168,
  }); // fallback: Provided police station geofence center
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

  const [trackedUsers, setTrackedUsers] = useState<any[]>([]);
  const [policeStations, setPoliceStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch("http://localhost:7777/api/users", {
          credentials: "include",
        });
        const usersData = await usersResponse.json();

        if (usersResponse.ok) {
          const baseLat = 32.437867;
          const baseLng = 77.577168;
          // Spread users across Himachal Pradesh
          const offsets = [
            { dLat: 0.45, dLng: -0.5 }, // Kullu/Manali belt
            { dLat: -0.32, dLng: 0.61 }, // towards Kinnaur
            { dLat: 0.18, dLng: 0.25 }, // north-east
            { dLat: -0.6, dLng: -0.3 }, // Hamirpur/Una side
            { dLat: 0.7, dLng: 0.15 }, // Lahaul/Spiti
            { dLat: -0.25, dLng: -0.75 }, // Kangra side
          ];
          const indianNames = [
            "Priya Sharma",
            "Aisha Khan",
            "Neha Verma",
            "Anjali Patel",
          ];

          const usersWithLocation = usersData.users
            .filter((user: any) => user.lastLocation)
            .map((user: any, idx: number) => {
              const lat = baseLat + offsets[idx % offsets.length].dLat;
              const lng = baseLng + offsets[idx % offsets.length].dLng;
              return {
                id: user._id,
                name: indianNames[idx % indianNames.length],
                status: user.status,
                location: {
                  lat,
                  lng,
                  address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                },
                lastUpdate: formatTimeAgo(user.lastLocation.timestamp),
                emergency: user.status === "emergency",
              };
            });
          setTrackedUsers(usersWithLocation);
        }

        // Fetch police stations
        const policeResponse = await fetch(
          "http://localhost:7777/api/police/stations"
        );
        const policeData = await policeResponse.json();

        if (policeResponse.ok) {
          const stationsWithLocation = policeData.policeStations.map(
            (station: any) => ({
              id: station._id,
              name: station.policeStationName,
              badgeNumber: station.badgeNumber,
              location: {
                lat: station.latitude,
                lng: station.longitude,
                address: `${station.latitude.toFixed(
                  4
                )}, ${station.longitude.toFixed(4)}`,
              },
              type: "police",
            })
          );
          setPoliceStations(stationsWithLocation);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Fallback across Himachal Pradesh around provided center
        const baseLat = 32.437867;
        const baseLng = 77.577168;
        setTrackedUsers([
          {
            id: "1",
            name: "Priya Sharma",
            status: "emergency",
            location: {
              lat: baseLat + 0.45,
              lng: baseLng - 0.5,
              address: `${(baseLat + 0.45).toFixed(4)}, ${(
                baseLng - 0.5
              ).toFixed(4)}`,
            },
            lastUpdate: "2 minutes ago",
            emergency: true,
          },
          {
            id: "2",
            name: "Aisha Khan",
            status: "warning",
            location: {
              lat: baseLat - 0.32,
              lng: baseLng + 0.61,
              address: `${(baseLat - 0.32).toFixed(4)}, ${(
                baseLng + 0.61
              ).toFixed(4)}`,
            },
            lastUpdate: "12 minutes ago",
            emergency: false,
          },
          {
            id: "3",
            name: "Neha Verma",
            status: "safe",
            location: {
              lat: baseLat + 0.18,
              lng: baseLng + 0.25,
              address: `${(baseLat + 0.18).toFixed(4)}, ${(
                baseLng + 0.25
              ).toFixed(4)}`,
            },
            lastUpdate: "1 hour ago",
            emergency: false,
          },
          {
            id: "4",
            name: "Anjali Patel",
            status: "safe",
            location: {
              lat: baseLat - 0.6,
              lng: baseLng - 0.3,
              address: `${(baseLat - 0.6).toFixed(4)}, ${(
                baseLng - 0.3
              ).toFixed(4)}`,
            },
            lastUpdate: "25 minutes ago",
            emergency: false,
          },
        ]);
        setPoliceStations([
          {
            id: "ps1",
            name: "Shimla Police",
            badgeNumber: "HP-SH-1001",
            location: {
              lat: baseLat - 0.25,
              lng: baseLng - 0.4,
              address: `${(baseLat - 0.25).toFixed(4)}, ${(
                baseLng - 0.4
              ).toFixed(4)}`,
            },
            type: "police",
          },
          {
            id: "ps2",
            name: "Kullu Police",
            badgeNumber: "HP-KL-1002",
            location: {
              lat: baseLat + 0.4,
              lng: baseLng - 0.2,
              address: `${(baseLat + 0.4).toFixed(4)}, ${(
                baseLng - 0.2
              ).toFixed(4)}`,
            },
            type: "police",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  };

  const markers: MapMarker[] = useMemo(
    () => [
      // User markers
      ...trackedUsers.map((u) => ({
        id: u.id,
        label: u.name,
        position: u.location,
        address: u.location.address,
        status: (u.status as "safe" | "warning" | "unknown") || "unknown",
        emergency: u.emergency,
        lastUpdate: u.lastUpdate,
        type: "user" as const,
      })),
      // Police station markers
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
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span>Police Station</span>
          </div>
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
