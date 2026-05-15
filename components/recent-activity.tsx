"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/config"

interface Activity {
  type: string
  action: string
  timestamp: string
  details?: any
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/activity`, {
          credentials: "include",
        })
        const data = await response.json()
        if (response.ok) {
          setActivities(data.activity.slice(0, 8))
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getIcon = (type: string) => {
    return type === "report" ? FileText : User
  }

  const getColor = (type: string) => {
    return type === "report"
      ? { bg: "bg-blue-100", text: "text-blue-600", badge: "bg-blue-100 text-blue-700" }
      : { bg: "bg-violet-100", text: "text-violet-600", badge: "bg-violet-100 text-violet-700" }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Recent System Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No recent activity
            </div>
          ) : (
            activities.map((activity, index) => {
              const IconComponent = getIcon(activity.type)
              const colors = getColor(activity.type)
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className={`p-1.5 rounded-lg ${colors.bg} shrink-0`}>
                    <IconComponent className={`h-3.5 w-3.5 ${colors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${colors.badge}`}
                      >
                        {activity.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
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
