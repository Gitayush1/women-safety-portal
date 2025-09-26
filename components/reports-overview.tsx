"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

interface ReportCategory {
  name: string
  count: number
  total: number
  color: string
}

export function ReportsOverview() {
  const [categories, setCategories] = useState<ReportCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [resolutionRate, setResolutionRate] = useState(0)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:7777/api/reports', {
          credentials: 'include',
        })
        const data = await response.json()
        
        if (response.ok) {
          const reports = data.reports
          
          // Calculate categories from actual data
          const categoryStats = {
            "Emergency": { count: 0, total: 0, color: "bg-destructive" },
            "Harassment": { count: 0, total: 0, color: "bg-yellow-500" },
            "Domestic Violence": { count: 0, total: 0, color: "bg-orange-500" },
            "Suspicious Activity": { count: 0, total: 0, color: "bg-blue-500" },
            "Other": { count: 0, total: 0, color: "bg-green-600" },
          }

          reports.forEach((report: any) => {
            const type = report.type || "Other"
            if (categoryStats[type as keyof typeof categoryStats]) {
              categoryStats[type as keyof typeof categoryStats].total++
              if (report.status === "resolved") {
                categoryStats[type as keyof typeof categoryStats].count++
              }
            }
          })

          const categoriesArray = Object.entries(categoryStats).map(([name, stats]) => ({
            name,
            count: stats.count,
            total: stats.total,
            color: stats.color,
          }))

          setCategories(categoriesArray)

          // Calculate resolution rate
          const totalReports = reports.length
          const resolvedReports = reports.filter((r: any) => r.status === "resolved").length
          const rate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0
          setResolutionRate(rate)
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading reports overview...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No reports found</div>
        ) : (
          <>
            {categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{category.name}</span>
                  <span className="text-muted-foreground">
                    {category.count}/{category.total}
                  </span>
                </div>
                <Progress 
                  value={category.total > 0 ? (category.count / category.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{resolutionRate}%</div>
                <div className="text-sm text-muted-foreground">Resolution Rate</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
