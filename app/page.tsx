import { ReportsOverview } from "@/components/reports-overview"
import { RecentReports } from "@/components/recent-reports"
import { StatsCards } from "@/components/stats-cards"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Women Safety Portal</h1>
            <p className="text-muted-foreground">Police Station Dashboard - Monitor and respond to safety reports</p>
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
        </main>
      </div>
    </AuthGuard>
  )
}
