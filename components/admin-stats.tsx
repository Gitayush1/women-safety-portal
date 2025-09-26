"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Activity, Settings } from "lucide-react"
import { useEffect, useState } from "react"

export function AdminStats() {
  const [stats, setStats] = useState([
    {
      title: "Active Officers",
      value: "0",
      description: "Currently on duty",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "System Uptime",
      value: "99.8%",
      description: "Last 30 days",
      icon: Activity,
      color: "text-green-600",
    },
    {
      title: "Security Level",
      value: "High",
      description: "All systems secure",
      icon: Shield,
      color: "text-purple-600",
    },
    {
      title: "Pending Updates",
      value: "3",
      description: "System maintenance",
      icon: Settings,
      color: "text-orange-500",
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
              title: "Active Officers",
              value: data.stats.totalOfficers.toString(),
              description: "Currently on duty",
              icon: Users,
              color: "text-blue-600",
            },
            {
              title: "System Uptime",
              value: "99.8%",
              description: "Last 30 days",
              icon: Activity,
              color: "text-green-600",
            },
            {
              title: "Security Level",
              value: "High",
              description: "All systems secure",
              icon: Shield,
              color: "text-purple-600",
            },
            {
              title: "Pending Updates",
              value: "3",
              description: "System maintenance",
              icon: Settings,
              color: "text-orange-500",
            },
          ])
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error)
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
