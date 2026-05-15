"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, User, LogOut, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function Header() {
  const [officerName, setOfficerName] = useState("Officer")
  const [badgeNumber, setBadgeNumber] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const router = useRouter()

  useEffect(() => {
    const name = localStorage.getItem("officerName") || "Officer"
    const badge = localStorage.getItem("badgeNumber") || ""
    setOfficerName(name)
    setBadgeNumber(badge)
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/police/logout`,
        { method: "POST", credentials: "include" }
      )
    } catch (err) {
      console.error("Logout API call failed:", err)
    } finally {
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("officerName")
      localStorage.removeItem("badgeNumber")
      router.push("/login")
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Live clock */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono font-medium tabular-nums">
              {currentTime}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="status-dot status-dot-online" />
            <span className="text-xs text-emerald-500 font-medium">LIVE</span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                id="notification-bell"
              >
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive text-white">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
                <span className="text-sm font-medium">New Emergency Report</span>
                <span className="text-xs text-muted-foreground">
                  High priority alert received • 2m ago
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
                <span className="text-sm font-medium">Report Resolved</span>
                <span className="text-xs text-muted-foreground">
                  RPT-015 marked as resolved • 15m ago
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
                <span className="text-sm font-medium">System Update</span>
                <span className="text-xs text-muted-foreground">
                  Risk detection model updated • 1h ago
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border" />

          {/* Officer Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium leading-none">{officerName}</div>
                  {badgeNumber && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      #{badgeNumber}
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
