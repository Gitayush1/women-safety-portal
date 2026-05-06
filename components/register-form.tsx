"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, User, Building, AlertCircle, MapPin } from "lucide-react"
import Link from "next/link"

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    policeStationName: "",
    badgeNumber: "",
    password: "",
    confirmPassword: "",
    latitude: "",
    longitude: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    // API call to backend
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7777'}/api/police/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for JWT
        body: JSON.stringify({
          policeStationName: formData.policeStationName,
          badgeNumber: formData.badgeNumber,
          password: formData.password,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Store auth state
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("officerName", formData.policeStationName)
      localStorage.setItem("badgeNumber", formData.badgeNumber)
      
      console.log("Registration successful:", data)
      
      // Redirect to main page
      window.location.href = "/"
      
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("") // Clear error when user starts typing
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Officer Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="policeStationName">Police Station Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="policeStationName"
                type="text"
                placeholder="Enter police station name"
                value={formData.policeStationName}
                onChange={(e) => handleInputChange("policeStationName", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badgeNumber">Badge Number</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="badgeNumber"
                type="text"
                placeholder="Enter your badge number"
                value={formData.badgeNumber}
                onChange={(e) => handleInputChange("badgeNumber", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 30.482576"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange("latitude", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 77.806039"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange("longitude", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Enter the exact latitude and longitude coordinates of the police station</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
