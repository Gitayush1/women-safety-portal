import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Shield, Database, Clock } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "user",
      action: "Officer Johnson logged in",
      timestamp: "2 minutes ago",
      icon: User,
      color: "text-blue-600",
    },
    {
      id: 2,
      type: "system",
      action: "Emergency notification sent to all officers",
      timestamp: "5 minutes ago",
      icon: Shield,
      color: "text-red-600",
    },
    {
      id: 3,
      type: "settings",
      action: "Auto backup settings updated by Admin",
      timestamp: "15 minutes ago",
      icon: Settings,
      color: "text-green-600",
    },
    {
      id: 4,
      type: "database",
      action: "Daily backup completed successfully",
      timestamp: "1 hour ago",
      icon: Database,
      color: "text-purple-600",
    },
    {
      id: 5,
      type: "user",
      action: "New officer account created: Officer Davis",
      timestamp: "2 hours ago",
      icon: User,
      color: "text-blue-600",
    },
    {
      id: 6,
      type: "system",
      action: "System maintenance completed",
      timestamp: "3 hours ago",
      icon: Settings,
      color: "text-green-600",
    },
  ]

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
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className={`p-2 rounded-full bg-muted`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>

              <div className="flex-1 space-y-1">
                <p className="text-sm text-foreground">{activity.action}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getTypeColor(activity.type)}>
                    {activity.type}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
