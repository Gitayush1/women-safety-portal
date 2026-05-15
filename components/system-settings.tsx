"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Database,
  Bell,
  Shield,
  Download,
  FileText,
  Loader2,
} from "lucide-react"
import { useState, useEffect } from "react"

export function SystemSettings() {
  const [settings, setSettings] = useState({
    notifications: true,
    tracking: true,
    backup: true,
    maintenance: false,
  })
  const [exporting, setExporting] = useState<string | null>(null)

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("systemSettings")
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Save settings to localStorage
  const updateSetting = (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    localStorage.setItem("systemSettings", JSON.stringify(updated))
  }

  const exportCSV = async () => {
    setExporting("csv")
    try {
      const response = await fetch("http://localhost:7777/api/reports", {
        credentials: "include",
      })
      const data = await response.json()

      if (response.ok && data.reports?.length > 0) {
        const headers = [
          "Report ID",
          "Type",
          "Status",
          "Priority",
          "Location",
          "Description",
          "Reporter Name",
          "Reporter Phone",
          "Assigned Station",
          "Created At",
        ]

        const rows = data.reports.map((r: any) => [
          r.reportId,
          r.type,
          r.status,
          r.priority,
          `"${(r.location || "").replace(/"/g, '""')}"`,
          `"${(r.description || "").replace(/"/g, '""')}"`,
          r.reporterName || "",
          r.reporterPhone || "",
          r.assignedStation || "",
          new Date(r.createdAt).toLocaleString(),
        ])

        const csvContent =
          [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join(
            "\n"
          )

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reports_${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setExporting(null)
    }
  }

  const exportPDF = async () => {
    setExporting("pdf")
    try {
      const response = await fetch("http://localhost:7777/api/reports", {
        credentials: "include",
      })
      const data = await response.json()

      if (response.ok && data.reports?.length > 0) {
        // Generate HTML-based printable report
        const reportRows = data.reports
          .map(
            (r: any) => `
          <tr>
            <td style="padding:6px 8px;border:1px solid #334155;">${r.reportId}</td>
            <td style="padding:6px 8px;border:1px solid #334155;">${r.type}</td>
            <td style="padding:6px 8px;border:1px solid #334155;">${r.status}</td>
            <td style="padding:6px 8px;border:1px solid #334155;">${r.priority}</td>
            <td style="padding:6px 8px;border:1px solid #334155;">${r.location || ""}</td>
            <td style="padding:6px 8px;border:1px solid #334155;">${r.reporterName || ""}</td>
            <td style="padding:6px 8px;border:1px solid #334155;">${new Date(r.createdAt).toLocaleDateString()}</td>
          </tr>`
          )
          .join("")

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Reports Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #475569; font-size: 14px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #1e3a5f; color: white; padding: 8px; text-align: left; }
    tr:nth-child(even) { background: #f1f5f9; }
    .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Police Command Center — Reports Export</h1>
  <h2>Generated: ${new Date().toLocaleString()} | Total Reports: ${data.reports.length}</h2>
  <table>
    <thead>
      <tr>
        <th>Report ID</th><th>Type</th><th>Status</th><th>Priority</th>
        <th>Location</th><th>Reporter</th><th>Date</th>
      </tr>
    </thead>
    <tbody>${reportRows}</tbody>
  </table>
  <div class="footer">Women Safety Division — Confidential Document</div>
</body>
</html>`

        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(htmlContent)
          printWindow.document.close()
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
      }
    } catch (err) {
      console.error("PDF export failed:", err)
    } finally {
      setExporting(null)
    }
  }

  const settingsList = [
    {
      id: "notifications",
      label: "Emergency Notifications",
      description: "Send instant alerts for emergency reports",
    },
    {
      id: "tracking",
      label: "Auto Location Tracking",
      description: "Automatically track user locations",
    },
    {
      id: "backup",
      label: "Daily Backups",
      description: "Automatic daily system backups",
    },
    {
      id: "maintenance",
      label: "Maintenance Mode",
      description: "Enable system maintenance mode",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Settings className="h-4 w-4 text-primary" />
          System Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {settingsList.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/30 transition-colors"
            >
              <div className="space-y-0.5">
                <Label htmlFor={setting.id} className="text-sm font-medium cursor-pointer">
                  {setting.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {setting.description}
                </p>
              </div>
              <Switch
                id={setting.id}
                checked={settings[setting.id as keyof typeof settings]}
                onCheckedChange={(checked) =>
                  updateSetting(setting.id, checked)
                }
              />
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Export & Actions
          </h4>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-9 text-xs"
            onClick={exportCSV}
            disabled={exporting !== null}
          >
            {exporting === "csv" ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-2" />
            )}
            Export Reports (CSV)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-9 text-xs"
            onClick={exportPDF}
            disabled={exporting !== null}
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-2" />
            )}
            Export Reports (PDF)
          </Button>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">System Version</p>
              <p className="text-[10px] text-muted-foreground">v2.1.0</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Up to date
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
