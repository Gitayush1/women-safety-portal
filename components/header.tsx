"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Shield, User, BarChart3, MapPin, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function Header() {
  const [officerName, setOfficerName] = useState("Officer")
  const [badgeNumber, setBadgeNumber] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Get officer info from localStorage
    const name = localStorage.getItem("officerName") || "Officer"
    const badge = localStorage.getItem("badgeNumber") || ""
    setOfficerName(name)
    setBadgeNumber(badge)
  }, [])

  const handleLogout = async () => {
    try {
      // Call backend logout API
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7777'}/api/police/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies for JWT
      })
    } catch (err) {
      console.error('Logout API call failed:', err)
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("officerName")
      localStorage.removeItem("badgeNumber")
      router.push("/login")
    }
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Police Station</h2>
                <p className="text-sm text-muted-foreground">Women Safety Division</p>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/tracking">
              <Button variant="ghost" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Live Tracking
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="relative bg-transparent">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm font-medium">{officerName}</div>
                  {badgeNumber && <div className="text-xs text-muted-foreground">#{badgeNumber}</div>}
                </div>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
