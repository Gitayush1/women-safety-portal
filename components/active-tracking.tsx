"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  phone: string;
  status: string;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  batteryLevel: number;
  updatedAt: string;
}

export function ActiveTracking() {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:7777/api/users", {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok) {
          const indianNames = [
            "Priya Sharma",
            "Aisha Khan",
            "Neha Verma",
            "Anjali Patel",
          ];
          const indianPhones = [
            "+91 98765 43210",
            "+91 91234 56780",
            "+91 90123 45678",
            "+91 98888 12345",
          ];
          const baseLat = 32.437867;
          const baseLng = 77.577168;
          const offsets = [
            { dLat: 0.0045, dLng: -0.005 },
            { dLat: -0.0032, dLng: 0.0061 },
            { dLat: 0.0018, dLng: 0.0025 },
            { dLat: -0.006, dLng: -0.003 },
          ];

          const firstFour = (data.users || [])
            .slice(0, 4)
            .map((u: any, idx: number) => ({
              ...u,
              name: indianNames[idx % indianNames.length],
              phone: indianPhones[idx % indianPhones.length],
              lastLocation: u.lastLocation
                ? {
                    ...u.lastLocation,
                    lat: baseLat + offsets[idx % offsets.length].dLat,
                    lng: baseLng + offsets[idx % offsets.length].dLng,
                  }
                : {
                    lat: baseLat + offsets[idx % offsets.length].dLat,
                    lng: baseLng + offsets[idx % offsets.length].dLng,
                    timestamp: new Date().toISOString(),
                  },
            }));

          setActiveUsers(firstFour); // Show only first 4 users with Indian context
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Fallback to Indian-context mock users
        setActiveUsers([
          {
            _id: "u1",
            name: "Priya Sharma",
            phone: "+91 98765 43210",
            status: "emergency",
            lastLocation: {
              lat: 28.6139,
              lng: 77.209,
              timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            },
            batteryLevel: 18,
            updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          },
          {
            _id: "u2",
            name: "Aisha Khan",
            phone: "+91 91234 56780",
            status: "warning",
            lastLocation: {
              lat: 28.6205,
              lng: 77.2303,
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            },
            batteryLevel: 42,
            updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
          {
            _id: "u3",
            name: "Neha Verma",
            phone: "+91 90123 45678",
            status: "safe",
            lastLocation: {
              lat: 28.6001,
              lng: 77.2007,
              timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
            },
            batteryLevel: 67,
            updatedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          },
          {
            _id: "u4",
            name: "Anjali Patel",
            phone: "+91 98888 12345",
            status: "safe",
            lastLocation: {
              lat: 19.076,
              lng: 72.8777,
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            }, // Mumbai
            batteryLevel: 84,
            updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDuration = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}min`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getStatusColor = (status: string, emergency: boolean) => {
    if (emergency) return "bg-destructive text-destructive-foreground";
    switch (status) {
      case "safe":
        return "bg-green-600 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getBatteryColor = (level: number) => {
    if (level < 20) return "text-destructive";
    if (level < 50) return "text-yellow-500";
    return "text-green-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Active Tracking
          <Badge variant="outline">{activeUsers.length} Users</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : activeUsers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No active users found
          </div>
        ) : (
          activeUsers.map((user) => (
            <div
              key={user._id}
              className={`p-4 border rounded-lg ${
                user.status === "emergency"
                  ? "border-destructive bg-destructive/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    {user.name}
                    {user.status === "emergency" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <Badge
                  className={getStatusColor(
                    user.status,
                    user.status === "emergency"
                  )}
                >
                  {user.status === "emergency" ? "EMERGENCY" : user.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {user.lastLocation
                    ? `${user.lastLocation.lat.toFixed(
                        4
                      )}, ${user.lastLocation.lng.toFixed(4)}`
                    : "No location"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Tracking for {formatDuration(user.updatedAt)}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-xs ${getBatteryColor(user.batteryLevel)}`}
                  >
                    Battery: {user.batteryLevel}%
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  SMS
                </Button>
                {user.status === "emergency" && (
                  <Button variant="destructive" size="sm" className="flex-1">
                    Dispatch
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
