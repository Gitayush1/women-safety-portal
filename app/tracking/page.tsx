import { LiveTrackingMap } from "@/components/live-tracking-map"
import { ActiveTracking } from "@/components/active-tracking"
import { TrackingControls } from "@/components/tracking-controls"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"

export default function TrackingPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Live Tracking System</h1>
            <p className="text-muted-foreground">Real-time location monitoring for women safety</p>
          </div>

          <TrackingControls />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveTrackingMap />
            </div>
            <div className="lg:col-span-1">
              <ActiveTracking />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
