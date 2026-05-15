"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Phone, AlertTriangle, ChevronRight } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { ReportDetailModal } from "@/components/report-detail-modal"
import { API_BASE_URL } from "@/lib/config"

interface Report {
  _id: string
  reportId: string
  type: string
  location: string
  createdAt: string
  status: string
  priority: string
  description: string
  reporterName?: string
  reporterPhone?: string
}

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        credentials: "include",
      })
      const data = await response.json()
      if (response.ok) {
        setReports(data.reports)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const displayedReports = showAll ? reports : reports.slice(0, 5)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-700 border-red-200"
      case "investigating": return "bg-amber-100 text-amber-700 border-amber-200"
      case "resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500"
      case "medium": return "border-l-amber-500"
      case "low": return "border-l-emerald-500"
      default: return "border-l-border"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700"
      case "medium": return "bg-amber-100 text-amber-700"
      case "low": return "bg-emerald-100 text-emerald-700"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="text-base font-semibold">Recent Reports</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs"
            >
              {showAll ? "Show Less" : `View All (${reports.length})`}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No reports found
            </div>
          ) : (
            displayedReports.map((report) => (
              <div
                key={report._id}
                className={`p-3.5 border-l-4 rounded-lg border border-border cursor-pointer
                  transition-all duration-200 hover:bg-accent/50 hover:border-primary/30
                  ${getPriorityIndicator(report.priority)}
                  ${report.priority === "high" && report.status === "active" ? "animate-pulse-emergency" : ""}`}
                onClick={() => setSelectedReportId(report._id)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {report.reportId}
                    </span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {report.type}
                    </Badge>
                    <Badge className={`text-xs px-1.5 py-0 ${getPriorityBadge(report.priority)}`}>
                      {report.priority === "high" && (
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {report.priority}
                    </Badge>
                    <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(report.status)}`}>
                      {report.status}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {report.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{report.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(report.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ReportDetailModal
        reportId={selectedReportId}
        open={selectedReportId !== null}
        onClose={() => setSelectedReportId(null)}
        onUpdated={fetchReports}
      />
    </>
  )
}
