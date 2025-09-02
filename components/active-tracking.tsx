import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, MessageSquare, MapPin, Clock, AlertTriangle } from "lucide-react"

export function ActiveTracking() {
  const activeUsers = [
    {
      id: "user-001",
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      status: "safe",
      location: "Downtown Market",
      duration: "45 min",
      emergency: false,
      batteryLevel: 85,
    },
    {
      id: "user-002",
      name: "Maria Garcia",
      phone: "+1 (555) 987-6543",
      status: "emergency",
      location: "Central Park Area",
      duration: "2 min",
      emergency: true,
      batteryLevel: 23,
    },
    {
      id: "user-003",
      name: "Jennifer Lee",
      phone: "+1 (555) 456-7890",
      status: "safe",
      location: "Times Square",
      duration: "1h 20min",
      emergency: false,
      batteryLevel: 67,
    },
    {
      id: "user-004",
      name: "Amanda Wilson",
      phone: "+1 (555) 321-0987",
      status: "warning",
      location: "University Campus",
      duration: "15 min",
      emergency: false,
      batteryLevel: 45,
    },
  ]

  const getStatusColor = (status: string, emergency: boolean) => {
    if (emergency) return "bg-destructive text-destructive-foreground"
    switch (status) {
      case "safe":
        return "bg-green-600 text-white"
      case "warning":
        return "bg-yellow-500 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getBatteryColor = (level: number) => {
    if (level < 20) return "text-destructive"
    if (level < 50) return "text-yellow-500"
    return "text-green-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Active Tracking
          <Badge variant="outline">{activeUsers.length} Users</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className={`p-4 border rounded-lg ${user.emergency ? "border-destructive bg-destructive/5" : "border-border"}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  {user.name}
                  {user.emergency && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </h4>
                <p className="text-sm text-muted-foreground">{user.phone}</p>
              </div>
              <Badge className={getStatusColor(user.status, user.emergency)}>
                {user.emergency ? "EMERGENCY" : user.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {user.location}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                Tracking for {user.duration}
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-xs ${getBatteryColor(user.batteryLevel)}`}>Battery: {user.batteryLevel}%</div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <MessageSquare className="h-3 w-3 mr-1" />
                SMS
              </Button>
              {user.emergency && (
                <Button variant="destructive" size="sm" className="flex-1">
                  Dispatch
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
