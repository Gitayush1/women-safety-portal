"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Clock,
  AlertTriangle,
  Brain,
} from "lucide-react"
import { useEffect, useState } from "react"

interface User {
  _id: string
  name: string
  phone: string
  status: string
  lastLocation?: { lat: number; lng: number; timestamp: string }
  batteryLevel: number
  updatedAt: string
  description?: string
  voiceTranscript?: string
  aiRisk?: {
    level: string
    priority: string
    confidence: number
    reason: string
  }
}

interface ActiveTrackingProps {
  viewMode: "all" | "emergency"
  refreshKey: number
  searchQuery?: string
  onCountsUpdate?: (total: number, emergency: number) => void
}

export function ActiveTracking({
  viewMode,
  refreshKey,
  searchQuery = "",
  onCountsUpdate,
}: ActiveTrackingProps) {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const handleResolve = async (userId: string) => {
    setResolvingId(userId)
    try {
      const response = await fetch(
        `http://localhost:7777/api/tracking/emergency/${userId}/resolve`,
        {
          method: "PATCH",
          credentials: "include",
        }
      )

      if (response.ok) {
        if (viewMode === "emergency") {
          // Remove the resolved user from the emergency list immediately
          setAllUsers((prev) => prev.filter((u) => u._id !== userId))
        } else {
          // Update the user's status to "safe" immediately in the "all" view
          setAllUsers((prev) =>
            prev.map((u) =>
              u._id === userId ? { ...u, status: "safe" } : u
            )
          )
        }
      } else {
        const error = await response.json()
        console.error("Failed to resolve emergency:", error)
        alert("Failed to resolve emergency: " + (error.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Failed to resolve emergency:", error)
      alert("Failed to resolve emergency. Please try again.")
    } finally {
      setResolvingId(null)
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      // Only show full loading spinner on first load
      setLoading((prev) => (prev ? true : false))
      try {
        const [allRes, emergencyRes] = await Promise.all([
          fetch("http://localhost:7777/api/tracking/users", {
            credentials: "include",
          }),
          fetch("http://localhost:7777/api/tracking/emergency", {
            credentials: "include",
          }),
        ])

        const allData = await allRes.json()
        const emergencyData = await emergencyRes.json()

        const users: User[] = allRes.ok ? allData.users || [] : []
        const emergencyUsers: User[] = emergencyRes.ok ? emergencyData.users || [] : []

        const displayUsers = viewMode === "emergency" ? emergencyUsers : users

        // Sort newest first by updatedAt
        const sorted = [...displayUsers].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        setAllUsers(sorted)

        onCountsUpdate?.(users.length, emergencyUsers.length)
      } catch (error) {
        console.error("Failed to fetch users:", error)
        setAllUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchUsers, 5000)
    return () => clearInterval(interval)
  }, [viewMode, refreshKey])

  // Client-side search filter
  const filteredUsers = searchQuery
    ? allUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers

  const formatDuration = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const getStatusColor = (status: string, emergency: boolean) => {
    if (emergency) return "bg-red-100 text-red-700 border-red-200"
    switch (status) {
      case "safe": return "bg-emerald-100 text-emerald-700"
      case "warning": return "bg-amber-100 text-amber-700"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getBatteryColor = (level: number) => {
    if (level < 20) return "text-red-500"
    if (level < 50) return "text-amber-500"
    return "text-emerald-500"
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="font-semibold">Active Tracking</span>
          <Badge variant="outline" className="text-xs">
            {filteredUsers.length} Users
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <div className="overflow-y-auto h-full px-6 pb-4 space-y-3 pt-1">
        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {searchQuery
              ? "No matching users"
              : `No ${viewMode === "emergency" ? "emergency" : "active"} users`}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isEmergency =
              viewMode === "emergency" ||
              user.status === "emergency"
            const displayStatus = (user.status || "unknown").toUpperCase()

            return (
              <div
                key={user._id}
                className={`p-3 border rounded-lg transition-all duration-200 hover:bg-accent/30 ${
                  isEmergency
                    ? "border-red-500/30 bg-red-500/5 animate-pulse-emergency"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      {user.name}
                      {isEmergency && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  </div>
                  <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(displayStatus.toLowerCase(), isEmergency)}`}>
                    {displayStatus}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs">
                  {user.lastLocation && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {`${user.lastLocation.lat.toFixed(4)}, ${user.lastLocation.lng.toFixed(4)}`}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(user.updatedAt)}
                    </div>
                    <span className={`text-[10px] font-medium ${getBatteryColor(user.batteryLevel)}`}>
                      🔋 {user.batteryLevel}%
                    </span>
                  </div>

                  {/* AI Risk info */}
                  {user.aiRisk && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Brain className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-primary">
                        AI: {user.aiRisk.level}
                        {user.aiRisk.confidence != null &&
                          ` (${(user.aiRisk.confidence * 100).toFixed(0)}%)`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description and Voice Transcript */}
                {(user.description || user.voiceTranscript) && (
                  <div className="mt-2 space-y-1">
                    {user.description && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Description: </span>
                        <span className="text-foreground">{user.description}</span>
                      </div>
                    )}
                    {user.voiceTranscript && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Voice: </span>
                        <span className="text-foreground italic">{user.voiceTranscript}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-2.5">
                  {isEmergency && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:cursor-pointer px-4"
                      onClick={() => handleResolve(user._id)}
                      disabled={resolvingId === user._id}
                    >
                      {resolvingId === user._id ? "Resolving..." : "Resolve"}
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
        </div>
      </CardContent>
    </Card>
  )
}
