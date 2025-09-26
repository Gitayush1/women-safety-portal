"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Shield, Database, Clock } from "lucide-react"
import { useEffect, useState } from "react"

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
        const response = await fetch('http://localhost:7777/api/admin/activity', {
          credentials: 'include',
        })
        const data = await response.json()
        
        if (response.ok) {
          setActivities(data.activity.slice(0, 6)) // Show only first 6 activities
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return User
      case "system":
        return Shield
      case "settings":
        return Settings
      case "database":
        return Database
      default:
        return User
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "user":
        return "text-blue-600"
      case "system":
        return "text-red-600"
      case "settings":
        return "text-green-600"
      case "database":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-100 text-blue-800"
      case "system":
        return "bg-red-100 text-red-800"
      case "settings":
        return "bg-green-100 text-green-800"
      case "database":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent System Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No recent activities</div>
          ) : (
            activities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type)
              return (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-full bg-muted`}>
                    <IconComponent className={`h-4 w-4 ${getActivityColor(activity.type)}`} />
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{activity.action}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getTypeColor(activity.type)}>
                        {activity.type}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(activity.timestamp)}
                      </div>
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
