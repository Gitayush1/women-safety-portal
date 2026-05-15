"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Users,
  MapPin,
  Timer,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"

type TrackingViewMode = "all" | "emergency"

interface TrackingControlsProps {
  viewMode: TrackingViewMode
  totalCount: number
  emergencyCount: number
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  onViewModeChange: (mode: TrackingViewMode) => void
}

export function TrackingControls({
  viewMode,
  totalCount,
  emergencyCount,
  searchQuery,
  onSearchChange,
  onRefresh,
  onViewModeChange,
}: TrackingControlsProps) {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        onRefresh()
      }, 10000) // 10 second auto-refresh
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, onRefresh])

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or phone..."
                className="pl-10 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground font-medium">{totalCount}</span>
                <span className="text-muted-foreground text-xs">Active</span>
              </div>
              {emergencyCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-red-700 font-medium">{emergencyCount}</span>
                  <span className="text-red-500 text-xs">SOS</span>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-border" />

            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-8 text-xs"
            >
              <Timer className="h-3.5 w-3.5 mr-1.5" />
              {autoRefresh ? "Auto: ON" : "Auto: OFF"}
            </Button>

            <Button variant="outline" size="sm" onClick={onRefresh} className="h-8 text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>

            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("all")}
                className="h-8 text-xs rounded-none border-0"
              >
                <MapPin className="h-3.5 w-3.5 mr-1" />
                All
              </Button>
              <Button
                variant={viewMode === "emergency" ? "destructive" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("emergency")}
                className="h-8 text-xs rounded-none border-0"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                SOS
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
