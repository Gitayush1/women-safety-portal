"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verify the JWT cookie with the backend — localStorage alone is not trustworthy
        const res = await fetch(`${API_BASE}/api/police/me`, {
          method: "GET",
          credentials: "include",
        })

        if (res.ok) {
          const data = await res.json()
          // Keep localStorage in sync for display purposes only
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem("officerName", data.policeStationName || "Officer")
          localStorage.setItem("badgeNumber", data.badgeNumber || "")
          setIsAuthenticated(true)
        } else {
          // Token invalid or expired — clear stale localStorage and redirect
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("officerName")
          localStorage.removeItem("badgeNumber")
          setIsAuthenticated(false)
          router.push("/login")
        }
      } catch {
        // Network error — fall back to cached auth state to avoid locking out offline users
        const cached = localStorage.getItem("isAuthenticated")
        if (cached === "true") {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          router.push("/login")
        }
      }
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
