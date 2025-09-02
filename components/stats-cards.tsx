import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react"

export function StatsCards() {
  const stats = [
    {
      title: "Active Reports",
      value: "12",
      description: "Pending investigation",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Resolved Today",
      value: "8",
      description: "Cases closed",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Response Time",
      value: "4.2 min",
      description: "Average response",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Women Tracked",
      value: "24",
      description: "Currently active",
      icon: Users,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
