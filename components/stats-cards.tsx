"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react"
import { useEffect, useState } from "react"

export function StatsCards() {
  const [stats, setStats] = useState({
    activeReports: 0,
    resolvedToday: 0,
    totalUsers: 0,
    emergencyReports: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:7777/api/admin/stats", {
          credentials: "include",
        })
        const data = await response.json()
        if (response.ok) {
          setStats({
            activeReports: data.stats.activeReports || 0,
            resolvedToday: data.stats.resolvedToday || 0,
            totalUsers: data.stats.totalUsers || 0,
            emergencyReports: data.stats.emergencyReports || 0,
          })
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }

    fetchStats()

    // Auto-refresh every 5 seconds to stay in sync with active tracking
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      title: "Active Reports",
      value: stats.emergencyReports,
      description: "Reports in emergency state",
      icon: AlertTriangle,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-500",
      borderColor: stats.emergencyReports > 0 ? "border-red-500/30" : "border-border",
      glow: stats.emergencyReports > 0,
    },
    {
      title: "Resolved Today",
      value: stats.resolvedToday,
      description: "Cases closed",
      icon: CheckCircle,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      borderColor: "border-border",
      glow: false,
    },
    {
      title: "Avg Response",
      value: "4.2 min",
      description: "Average response time",
      icon: Clock,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
      borderColor: "border-border",
      glow: false,
      isText: true,
    },
    {
      title: "Women Tracked",
      value: stats.totalUsers,
      description: "Currently active",
      icon: Users,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
      borderColor: "border-border",
      glow: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${card.borderColor} ${
            card.glow ? "animate-pulse-emergency" : ""
          }`}
        >
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </p>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className="animate-count-up">
              <div className="text-3xl font-bold text-foreground tracking-tight">
                {card.isText ? card.value : card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
