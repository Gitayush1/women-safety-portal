"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { API_BASE_URL } from "@/lib/config"

interface CategoryStat {
  name: string
  total: number
  resolved: number
  color: string
}

export function ReportsOverview() {
  const [categories, setCategories] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [resolutionRate, setResolutionRate] = useState(0)
  const [totalReports, setTotalReports] = useState(0)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
          credentials: "include",
        })
        const data = await response.json()

        if (response.ok) {
          const reports = data.reports
          const categoryMap: Record<string, { total: number; resolved: number }> = {
            Emergency: { total: 0, resolved: 0 },
            Harassment: { total: 0, resolved: 0 },
            "Domestic Violence": { total: 0, resolved: 0 },
            "Suspicious Activity": { total: 0, resolved: 0 },
            Other: { total: 0, resolved: 0 },
          }

          const colors: Record<string, string> = {
            Emergency: "#ef4444",
            Harassment: "#f59e0b",
            "Domestic Violence": "#f97316",
            "Suspicious Activity": "#3b82f6",
            Other: "#10b981",
          }

          reports.forEach((report: any) => {
            const type = report.type || "Other"
            if (categoryMap[type]) {
              categoryMap[type].total++
              if (report.status === "resolved") categoryMap[type].resolved++
            }
          })

          const arr = Object.entries(categoryMap).map(([name, stats]) => ({
            name,
            total: stats.total,
            resolved: stats.resolved,
            color: colors[name] || "#6b7280",
          }))

          setCategories(arr)
          setTotalReports(reports.length)

          const resolvedCount = reports.filter(
            (r: any) => r.status === "resolved"
          ).length
          setResolutionRate(
            reports.length > 0
              ? Math.round((resolvedCount / reports.length) * 100)
              : 0
          )
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const chartData = categories
    .filter((c) => c.total > 0)
    .map((c) => ({ name: c.name, value: c.total, color: c.color }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Reports Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Loading overview...
          </div>
        ) : totalReports === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No reports yet
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#1e293b",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">
                    {totalReports}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    TOTAL
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-muted-foreground text-xs">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-foreground font-medium text-xs">
                    {cat.resolved}/{cat.total}
                  </span>
                </div>
              ))}
            </div>

            {/* Resolution Rate */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Resolution Rate
                </span>
                <span className="text-sm font-bold text-foreground">
                  {resolutionRate}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
