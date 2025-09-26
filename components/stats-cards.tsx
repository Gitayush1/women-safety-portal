"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react"
import { useEffect, useState } from "react"

export function StatsCards() {
  const [stats, setStats] = useState([
    {
      title: "Active Reports",
      value: "0",
      description: "Pending investigation",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Resolved Today",
      value: "0",
      description: "Cases closed",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Response Time",
      value: "0 min",
      description: "Average response",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Women Tracked",
      value: "0",
      description: "Currently active",
      icon: Users,
      color: "text-purple-600",
    },
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:7777/api/admin/stats', {
          credentials: 'include',
        })
        const data = await response.json()
        
        if (response.ok) {
          setStats([
            {
              title: "Active Reports",
              value: data.stats.activeReports.toString(),
              description: "Pending investigation",
              icon: AlertTriangle,
              color: "text-destructive",
            },
            {
              title: "Resolved Today",
              value: data.stats.resolvedToday.toString(),
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
              value: data.stats.totalUsers.toString(),
              description: "Currently active",
              icon: Users,
              color: "text-purple-600",
            },
          ])
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

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
