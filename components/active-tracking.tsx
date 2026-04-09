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

type TrackingViewMode = "all" | "emergency";

interface ActiveTrackingProps {
  viewMode: TrackingViewMode;
  refreshKey: number;
}

export function ActiveTracking({ viewMode, refreshKey }: ActiveTrackingProps) {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const endpoint =
          viewMode === "emergency"
            ? "http://localhost:7777/api/tracking/emergency"
            : "http://localhost:7777/api/tracking/users";
        const response = await fetch(endpoint, { credentials: "include" });
        const data = await response.json();

        if (response.ok) {
          setActiveUsers((data.users || []).slice(0, 8));
        } else {
          setActiveUsers([]);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setActiveUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [viewMode, refreshKey]);

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
    if (emergency) return "bg-destructive text-white";
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
            No {viewMode === "emergency" ? "emergency" : "active"} users found
          </div>
        ) : (
          activeUsers.map((user) => {
            const isEmergency = viewMode === "emergency";
            const forcedStatus = isEmergency
              ? (user.status || "unknown").toUpperCase()
              : "SAFE";
            return (
            <div
              key={user._id}
              className={`p-4 border rounded-lg ${
                isEmergency
                  ? "border-destructive bg-destructive/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    {user.name}
                    {isEmergency && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <Badge
                  className={getStatusColor(
                    forcedStatus.toLowerCase(),
                    isEmergency
                  )}
                >
                  {forcedStatus}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {user.lastLocation ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {`${user.lastLocation.lat.toFixed(
                      4
                    )}, ${user.lastLocation.lng.toFixed(4)}`}
                  </div>
                ) : null}
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
                {isEmergency && (
                  <Button variant="destructive" size="sm" className="flex-1">
                    Dispatch
                  </Button>
                )}
              </div>
            </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
