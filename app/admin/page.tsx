"use client"

import { AdminStats } from "@/components/admin-stats"
import { OfficerManagement } from "@/components/officer-management"
import { SystemSettings } from "@/components/system-settings"
import { RecentActivity } from "@/components/recent-activity"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AdminPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">
            Admin Command Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            System administration, officer management, and operations control
          </p>
        </div>

        <AdminStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OfficerManagement />
          <SystemSettings />
        </div>

        <RecentActivity />
      </div>
    </DashboardLayout>
  )
}
