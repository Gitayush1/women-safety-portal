"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Phone } from "lucide-react"
import { useEffect, useState } from "react"

interface Report {
  _id: string
  reportId: string
  type: string
  location: string
  createdAt: string
  status: string
  priority: string
  description: string
}

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:7777/api/reports', {
          credentials: 'include',
        })
        const data = await response.json()
        
        if (response.ok) {
          setReports(data.reports.slice(0, 4)) // Show only first 4 reports
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-destructive text-destructive-foreground"
      case "investigating":
        return "bg-yellow-500 text-white"
      case "resolved":
        return "bg-green-600 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-destructive"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-600"
      default:
        return "border-l-border"
    }
  }

  const getRiskBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-yellow-500 text-white"
      case "low":
        return "bg-green-600 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Reports
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No reports found</div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className={`p-4 border-l-4 bg-card rounded-lg ${getPriorityColor(report.priority)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{report.reportId}</span>
                  <Badge variant="outline">{report.type}</Badge>
                  <Badge className={getRiskBadgeColor(report.priority)}>Risk: {report.priority}</Badge>
                  <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-foreground mb-2">{report.description}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {report.location}
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
  )
}
