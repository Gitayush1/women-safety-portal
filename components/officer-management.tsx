"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Search, Plus, Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface Officer {
  _id: string
  badgeNumber: string
  policeStationName: string
  createdAt: string
  updatedAt: string
}

export function OfficerManagement() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const response = await fetch('http://localhost:7777/api/admin/officers', {
          credentials: 'include',
        })
        const data = await response.json()
        
        if (response.ok) {
          setOfficers(data.officers)
        }
      } catch (error) {
        console.error('Failed to fetch officers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOfficers()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

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
          {loading ? (
            <div className="text-center py-4">Loading officers...</div>
          ) : officers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No officers found</div>
          ) : (
            officers.map((officer) => (
              <div key={officer._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Badge #{officer.badgeNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {officer.policeStationName}
                    </div>
                    <div className="text-xs text-muted-foreground">Created: {formatTimeAgo(officer.createdAt)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">Active</Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
