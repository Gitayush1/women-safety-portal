import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Search, Plus, Edit, Trash2 } from "lucide-react"

export function OfficerManagement() {
  const officers = [
    {
      id: "12345",
      name: "Officer Smith",
      rank: "Sergeant",
      department: "Women Safety",
      status: "active",
      lastLogin: "2 hours ago",
    },
    {
      id: "12346",
      name: "Officer Johnson",
      rank: "Constable",
      department: "Women Safety",
      status: "active",
      lastLogin: "30 minutes ago",
    },
    {
      id: "12347",
      name: "Officer Williams",
      rank: "Inspector",
      department: "Women Safety",
      status: "offline",
      lastLogin: "1 day ago",
    },
    {
      id: "12348",
      name: "Officer Brown",
      rank: "Constable",
      department: "Women Safety",
      status: "active",
      lastLogin: "5 minutes ago",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600 text-white"
      case "offline":
        return "bg-gray-500 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Officer Management
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Officer
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search officers..." className="pl-10" />
        </div>

        <div className="space-y-3">
          {officers.map((officer) => (
            <div key={officer.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{officer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {officer.rank} • Badge #{officer.id}
                  </div>
                  <div className="text-xs text-muted-foreground">Last login: {officer.lastLogin}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(officer.status)}>{officer.status}</Badge>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
