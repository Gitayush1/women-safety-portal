"use client"

import GoogleTrackingMap, { type TrackedUser } from "@/components/google-tracking-map"
import { useState, useEffect } from "react"

export default function TrackingWithGoogleMapsPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [users, setUsers] = useState<TrackedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch('http://localhost:7777/api/users', {
          credentials: 'include',
        });
        const usersData = await usersResponse.json();
        
        let trackedUsers: TrackedUser[] = [];
        if (usersResponse.ok) {
          trackedUsers = usersData.users
            .filter((user: any) => user.lastLocation)
            .map((user: any) => ({
              id: user._id,
              name: user.name,
              status: user.status,
              position: { lat: user.lastLocation.lat, lng: user.lastLocation.lng },
              note: user.status === "emergency" ? "SOS triggered" : "Active tracking",
              type: "user" as const,
            }));
        }

        // Fetch police stations
        const policeResponse = await fetch('http://localhost:7777/api/police/stations');
        const policeData = await policeResponse.json();
        
        let policeStations: TrackedUser[] = [];
        if (policeResponse.ok) {
          policeStations = policeData.policeStations.map((station: any) => ({
            id: station._id,
            name: station.policeStationName,
            position: { lat: station.latitude, lng: station.longitude },
            note: `Badge: ${station.badgeNumber}`,
            type: "police" as const,
          }));
        }

        setUsers([...trackedUsers, ...policeStations]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fallback to mock data
        setUsers([
          {
            id: "1",
            name: "Priya Sharma",
            status: "emergency",
            position: { lat: 28.6139, lng: 77.209 },
            note: "SOS triggered 2 mins ago",
            type: "user",
          },
          {
            id: "2",
            name: "Aisha Khan",
            status: "warning",
            position: { lat: 28.6205, lng: 77.2303 },
            note: "No response on call",
            type: "user",
          },
          {
            id: "3",
            name: "Neha Verma",
            status: "safe",
            position: { lat: 28.6001, lng: 77.2007 },
            note: "Trip sharing active",
            type: "user",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading map data...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Live Tracking (Google Maps)
          </h1>
          <p className="text-sm text-muted-foreground">Real-time positions of users and police stations with status indicators.</p>
        </div>
        {/* You can add filters/controls here if needed */}
      </header>

      <section className="rounded-lg border bg-card">
        <GoogleTrackingMap apiKey={apiKey} users={users} height={70} className="rounded-lg" />
      </section>

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
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span>Emergency</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Note: This page uses Google Maps JavaScript API via @vis.gl/react-google-maps. Add your Google Maps API key in
        Project Settings to enable.
      </div>
    </main>
  )
}
