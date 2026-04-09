import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, RefreshCw, AlertTriangle, Users, MapPin } from "lucide-react"

type TrackingViewMode = "all" | "emergency"

interface TrackingControlsProps {
  viewMode: TrackingViewMode
  totalCount: number
  emergencyCount: number
  onRefresh: () => void
  onViewModeChange: (mode: TrackingViewMode) => void
}

export function TrackingControls({
  viewMode,
  totalCount,
  emergencyCount,
  onRefresh,
  onViewModeChange,
}: TrackingControlsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or phone..." className="pl-10" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{totalCount} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <Badge variant="destructive">{emergencyCount} Emergency</Badge>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("all")}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View All
            </Button>
            <Button
              variant={viewMode === "emergency" ? "destructive" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("emergency")}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
