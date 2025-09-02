import { AdminStats } from "@/components/admin-stats"
import { OfficerManagement } from "@/components/officer-management"
import { SystemSettings } from "@/components/system-settings"
import { RecentActivity } from "@/components/recent-activity"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"

export default function AdminPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Admin Management Panel</h1>
            <p className="text-muted-foreground">System administration and officer management</p>
          </div>

          <AdminStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OfficerManagement />
            <SystemSettings />
          </div>

          <RecentActivity />
        </main>
      </div>
    </AuthGuard>
  )
}
