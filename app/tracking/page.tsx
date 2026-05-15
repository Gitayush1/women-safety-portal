"use client"

import { LiveTrackingMap } from "@/components/live-tracking-map"
import { ActiveTracking } from "@/components/active-tracking"
import { TrackingControls } from "@/components/tracking-controls"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState } from "react"

export default function TrackingPage() {
  const [viewMode, setViewMode] = useState<"all" | "emergency">("all")
  const [refreshKey, setRefreshKey] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [emergencyCount, setEmergencyCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">
            Live Tracking System
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time location monitoring and emergency response
          </p>
        </div>

        <TrackingControls
          viewMode={viewMode}
          totalCount={totalCount}
          emergencyCount={emergencyCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
          onViewModeChange={setViewMode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-13rem)] lg:sticky lg:top-6">
          <div className="lg:col-span-2 lg:overflow-hidden lg:flex lg:flex-col">
            <LiveTrackingMap viewMode={viewMode} refreshKey={refreshKey} />
          </div>
          <div className="lg:col-span-1 lg:overflow-hidden lg:flex lg:flex-col">
            <ActiveTracking
              viewMode={viewMode}
              refreshKey={refreshKey}
              searchQuery={searchQuery}
              onCountsUpdate={(total, emergency) => {
                setTotalCount(total)
                setEmergencyCount(emergency)
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
