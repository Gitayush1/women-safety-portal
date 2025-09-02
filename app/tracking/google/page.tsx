import GoogleTrackingMap, { type TrackedUser } from "@/components/google-tracking-map"

export const metadata = {
  title: "Tracking (Google Maps)",
}

export default function TrackingWithGoogleMapsPage() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY // read server-only env var and pass to client, removing NEXT_PUBLIC_* usage

  // Mock data for demo – replace with your live data later
  const users: TrackedUser[] = [
    {
      id: "1",
      name: "Priya Sharma",
      status: "emergency",
      position: { lat: 28.6139, lng: 77.209 },
      note: "SOS triggered 2 mins ago",
    },
    {
      id: "2",
      name: "Aisha Khan",
      status: "warning",
      position: { lat: 28.6205, lng: 77.2303 },
      note: "No response on call",
    },
    {
      id: "3",
      name: "Neha Verma",
      status: "safe",
      position: { lat: 28.6001, lng: 77.2007 },
      note: "Trip sharing active",
    },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Live Tracking (Google Maps)
          </h1>
          <p className="text-sm text-muted-foreground">Real-time positions of users with status indicators.</p>
        </div>
        {/* You can add filters/controls here if needed */}
      </header>

      <section className="rounded-lg border bg-card">
        <GoogleTrackingMap apiKey={apiKey} users={users} height={70} className="rounded-lg" />
      </section>

      <div className="mt-4 text-xs text-muted-foreground">
        Note: This page uses Google Maps JavaScript API via @vis.gl/react-google-maps. Add your Google Maps API key in
        Project Settings to enable.
      </div>
    </main>
  )
}
