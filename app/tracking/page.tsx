"use client"

import { LiveTrackingMap } from "@/components/live-tracking-map"
import { ActiveTracking } from "@/components/active-tracking"
import { TrackingControls } from "@/components/tracking-controls"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"
import { useEffect, useState } from "react"

export default function TrackingPage() {
  const [viewMode, setViewMode] = useState<"all" | "emergency">("all")
  const [refreshKey, setRefreshKey] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [emergencyCount, setEmergencyCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [allRes, emergencyRes] = await Promise.all([
          fetch("http://localhost:7777/api/tracking/users", { credentials: "include" }),
          fetch("http://localhost:7777/api/tracking/emergency", { credentials: "include" }),
        ])

        const allData = await allRes.json()
        const emergencyData = await emergencyRes.json()

        if (allRes.ok) {
          setTotalCount((allData.users || []).length)
        } else {
          setTotalCount(0)
        }

        if (emergencyRes.ok) {
          setEmergencyCount((emergencyData.users || []).length)
        } else {
          setEmergencyCount(0)
        }
      } catch (error) {
        setTotalCount(0)
        setEmergencyCount(0)
      }
    }

    fetchCounts()
  }, [refreshKey])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Live Tracking System</h1>
            <p className="text-muted-foreground">Real-time location monitoring for women safety</p>
          </div>

          <TrackingControls
            viewMode={viewMode}
            totalCount={totalCount}
            emergencyCount={emergencyCount}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
            onViewModeChange={setViewMode}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveTrackingMap viewMode={viewMode} refreshKey={refreshKey} />
            </div>
            <div className="lg:col-span-1">
              <ActiveTracking viewMode={viewMode} refreshKey={refreshKey} />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
