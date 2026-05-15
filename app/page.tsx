"use client"

import { ReportsOverview } from "@/components/reports-overview"
import { RecentReports } from "@/components/recent-reports"
import { StatsCards } from "@/components/stats-cards"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">
            Operations Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring and emergency response overview
          </p>
        </div>

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentReports />
          </div>
          <div className="lg:col-span-1">
            <ReportsOverview />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
