"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Shield, Activity, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

export function AdminStats() {
  const [stats, setStats] = useState({
    totalOfficers: 0,
    totalReports: 0,
    activeReports: 0,
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
            totalOfficers: data.stats.totalOfficers || 0,
            totalReports: data.stats.totalReports || 0,
            activeReports: data.stats.activeReports || 0,
            emergencyReports: data.stats.emergencyReports || 0,
          })
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      title: "Active Officers",
      value: stats.totalOfficers,
      description: "Registered in station",
      icon: Users,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
    },
    {
      title: "Total Reports",
      value: stats.totalReports,
      description: "All time",
      icon: Shield,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
    },
    {
      title: "Active Cases",
      value: stats.activeReports,
      description: "Require attention",
      icon: Activity,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
    },
    {
      title: "High Priority",
      value: stats.emergencyReports,
      description: "Emergency level",
      icon: AlertTriangle,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-500",
      glow: stats.emergencyReports > 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`transition-all duration-300 hover:scale-[1.02] ${
            card.glow ? "border-red-500/30 animate-pulse-emergency" : ""
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
                {card.value}
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
