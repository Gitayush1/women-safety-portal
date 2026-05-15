"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Clock,
  User,
  Phone,
  FileText,
  Shield,
  Brain,
  Send,
  AlertTriangle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/config"

interface Report {
  _id: string
  reportId: string
  type: string
  location: string
  createdAt: string
  updatedAt: string
  status: string
  priority: string
  description: string
  voiceTranscript?: string
  reporterName?: string
  reporterPhone?: string
  assignedOfficer?: { _id: string; badgeNumber: string; policeStationName: string }
  assignedStation?: string
  riskConfidence?: number
  riskReason?: string
  riskSource?: string
  coordinates?: { lat: number; lng: number }
  notes?: Array<{
    note: string
    addedBy?: { badgeNumber: string; policeStationName: string }
    timestamp: string
  }>
}

interface Officer {
  _id: string
  badgeNumber: string
  policeStationName: string
}

interface ReportDetailModalProps {
  reportId: string | null
  open: boolean
  onClose: () => void
  onUpdated?: () => void
}

export function ReportDetailModal({
  reportId,
  open,
  onClose,
  onUpdated,
}: ReportDetailModalProps) {
  const [report, setReport] = useState<Report | null>(null)
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [assigningOfficer, setAssigningOfficer] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    if (!reportId || !open) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [reportRes, officersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/api/admin/officers`, {
            credentials: "include",
          }),
        ])

        if (reportRes.ok) {
          const data = await reportRes.json()
          setReport(data.report)
        }
        if (officersRes.ok) {
          const data = await officersRes.json()
          setOfficers(data.officers || [])
        }
      } catch (err) {
        console.error("Failed to fetch report details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [reportId, open])

  const handleStatusChange = async (newStatus: string) => {
    if (!report) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reports/${report._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
        onUpdated?.()
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAssignOfficer = async (officerId: string) => {
    if (!report) return
    setAssigningOfficer(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reports/${report._id}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ officerId }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
        onUpdated?.()
      }
    } catch (err) {
      console.error("Failed to assign officer:", err)
    } finally {
      setAssigningOfficer(false)
    }
  }

  const handleAddNote = async () => {
    if (!report || !newNote.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reports/${report._id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ note: newNote.trim() }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
        setNewNote("")
        onUpdated?.()
      }
    } catch (err) {
      console.error("Failed to add note:", err)
    } finally {
      setAddingNote(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-700 border-red-200"
      case "investigating": return "bg-amber-100 text-amber-700 border-amber-200"
      case "resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200"
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200"
      case "low": return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Always-present title for screen reader accessibility */}
        <DialogTitle className="sr-only">Report Details</DialogTitle>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading report details...
          </div>
        ) : !report ? (
          <div className="py-12 text-center text-muted-foreground">
            Report not found
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  {report.reportId}
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{report.type}</Badge>
                  <Badge className={getPriorityColor(report.priority)}>
                    {report.priority === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {report.priority} risk
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Status & Assignment Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Status
                  </label>
                  <Select
                    value={report.status}
                    onValueChange={handleStatusChange}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">🔴 Active</SelectItem>
                      <SelectItem value="investigating">🟡 Investigating</SelectItem>
                      <SelectItem value="resolved">🟢 Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Assigned Officer
                  </label>
                  <Select
                    value={report.assignedOfficer?._id || ""}
                    onValueChange={handleAssignOfficer}
                    disabled={assigningOfficer}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Assign officer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {officers.map((officer) => (
                        <SelectItem key={officer._id} value={officer._id}>
                          #{officer.badgeNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Report Details */}
              <div className="space-y-3">
                <p className="text-sm text-foreground">{report.description}</p>

                {report.voiceTranscript && (
                  <div className="p-3 rounded-lg bg-accent/50 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Voice Transcript
                    </p>
                    <p className="text-sm text-foreground italic">
                      &quot;{report.voiceTranscript}&quot;
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{report.reporterName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{report.reporterPhone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{report.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    <span>{report.assignedStation || "Unassigned"}</span>
                  </div>
                </div>
              </div>

              {/* AI Risk Analysis */}
              {report.riskReason && (
                <>
                  <Separator />
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">
                        AI Risk Analysis
                      </span>
                      {report.riskSource && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {report.riskSource}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{report.riskReason}</p>
                    {report.riskConfidence != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(report.riskConfidence * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(report.riskConfidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              <Separator />
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Investigation Notes
                </h4>

                {report.notes && report.notes.length > 0 ? (
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {report.notes.map((note, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-accent/50 border border-border text-sm"
                      >
                        <p className="text-foreground">{note.note}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          {note.addedBy && (
                            <span>#{note.addedBy.badgeNumber}</span>
                          )}
                          <span>{formatDate(note.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    No notes yet
                  </p>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add investigation note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
