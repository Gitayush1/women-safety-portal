import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Bell, Shield, Download } from "lucide-react"

export function SystemSettings() {
  const settings = [
    {
      id: "notifications",
      label: "Emergency Notifications",
      description: "Send instant alerts for emergency reports",
      enabled: true,
    },
    {
      id: "tracking",
      label: "Auto Location Tracking",
      description: "Automatically track user locations",
      enabled: true,
    },
    {
      id: "backup",
      label: "Daily Backups",
      description: "Automatic daily system backups",
      enabled: true,
    },
    {
      id: "maintenance",
      label: "Maintenance Mode",
      description: "Enable system maintenance mode",
      enabled: false,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor={setting.id} className="text-sm font-medium">
                  {setting.label}
                </Label>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
              <Switch id={setting.id} defaultChecked={setting.enabled} />
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground">System Actions</h4>

          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" size="sm" className="justify-start bg-transparent">
              <Database className="h-4 w-4 mr-2" />
              Database Backup
            </Button>
            <Button variant="outline" size="sm" className="justify-start bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
            <Button variant="outline" size="sm" className="justify-start bg-transparent">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </Button>
            <Button variant="outline" size="sm" className="justify-start bg-transparent">
              <Bell className="h-4 w-4 mr-2" />
              Test Alerts
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">System Version</p>
              <p className="text-xs text-muted-foreground">v2.1.0</p>
            </div>
            <Badge variant="outline">Up to date</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
