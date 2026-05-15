"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { User, Search, Plus, Edit, Trash2, Shield, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [currentStation, setCurrentStation] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null)
  const [formData, setFormData] = useState({ badgeNumber: "", password: "" })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchOfficers = async () => {
    try {
      const response = await fetch("http://localhost:7777/api/admin/officers", {
        credentials: "include",
      })
      const data = await response.json()
      if (response.ok) {
        setOfficers(data.officers)
        if (data.officers.length > 0) {
          setCurrentStation(data.officers[0].policeStationName)
        }
      }
    } catch (error) {
      console.error("Failed to fetch officers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOfficers()
  }, [])

  const filteredOfficers = searchQuery
    ? officers.filter(
        (o) =>
          o.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.policeStationName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : officers

  const handleAddClick = () => {
    setEditingOfficer(null)
    setFormData({ badgeNumber: "", password: "" })
    setFormError("")
    setModalOpen(true)
  }

  const handleEditClick = (officer: Officer) => {
    setEditingOfficer(officer)
    setFormData({ badgeNumber: officer.badgeNumber, password: "" })
    setFormError("")
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.badgeNumber.trim()) {
      setFormError("Badge number is required")
      return
    }
    if (!editingOfficer && (!formData.password || formData.password.length < 8)) {
      setFormError("Password must be at least 8 characters")
      return
    }

    setFormLoading(true)
    setFormError("")

    try {
      if (editingOfficer) {
        // Update
        const res = await fetch(
          `http://localhost:7777/api/admin/officers/${editingOfficer._id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ badgeNumber: formData.badgeNumber }),
          }
        )
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to update officer")
        }
      } else {
        // Create
        const res = await fetch("http://localhost:7777/api/admin/officers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            badgeNumber: formData.badgeNumber,
            password: formData.password,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to create officer")
        }
      }

      setModalOpen(false)
      fetchOfficers()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const res = await fetch(
        `http://localhost:7777/api/admin/officers/${deleteId}`,
        { method: "DELETE", credentials: "include" }
      )
      if (res.ok) {
        setDeleteId(null)
        fetchOfficers()
      }
    } catch (err) {
      console.error("Failed to delete officer:", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    )
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Officer Management</div>
              {currentStation && (
                <div className="text-xs font-normal text-muted-foreground mt-0.5">
                  {currentStation} Station
                </div>
              )}
            </div>
            <Button size="sm" onClick={handleAddClick} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Officer
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search officers..."
              className="pl-10 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Loading officers...
              </div>
            ) : filteredOfficers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {searchQuery ? "No matching officers" : "No officers found"}
              </div>
            ) : (
              filteredOfficers.map((officer) => (
                <div
                  key={officer._id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/15 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">
                        Badge #{officer.badgeNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {officer.policeStationName} • {formatTimeAgo(officer.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">
                      Active
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleEditClick(officer)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(officer._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Officer Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingOfficer ? "Edit Officer" : "Add New Officer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="badge" className="text-sm">Badge Number</Label>
              <Input
                id="badge"
                value={formData.badgeNumber}
                onChange={(e) =>
                  setFormData({ ...formData, badgeNumber: e.target.value })
                }
                placeholder="e.g., HP-SH-1001"
                className="h-9"
              />
            </div>
            {!editingOfficer && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min 8 characters"
                  className="h-9"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading}>
              {formLoading
                ? "Saving..."
                : editingOfficer
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Officer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this officer? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
