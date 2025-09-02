import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Phone } from "lucide-react"

export function RecentReports() {
  const reports = [
    {
      id: "RPT-001",
      type: "Emergency",
      location: "Downtown Market Area",
      time: "2 minutes ago",
      status: "active",
      priority: "high",
      description: "Woman reports feeling followed by unknown individual",
    },
    {
      id: "RPT-002",
      type: "Harassment",
      location: "University Campus",
      time: "15 minutes ago",
      status: "investigating",
      priority: "medium",
      description: "Verbal harassment reported near library building",
    },
    {
      id: "RPT-003",
      type: "Domestic Violence",
      location: "Residential Area Block 5",
      time: "1 hour ago",
      status: "resolved",
      priority: "high",
      description: "Domestic dispute resolved, counseling provided",
    },
    {
      id: "RPT-004",
      type: "Suspicious Activity",
      location: "Bus Station",
      time: "2 hours ago",
      status: "investigating",
      priority: "low",
      description: "Suspicious individual loitering near women's waiting area",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-destructive text-destructive-foreground"
      case "investigating":
        return "bg-yellow-500 text-white"
      case "resolved":
        return "bg-green-600 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-destructive"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-600"
      default:
        return "border-l-border"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Reports
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className={`p-4 border-l-4 bg-card rounded-lg ${getPriorityColor(report.priority)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{report.id}</span>
                <Badge variant="outline">{report.type}</Badge>
                <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-foreground mb-2">{report.description}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {report.location}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {report.time}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
