"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Mail,
  MailOpen,
  Clock,
  AlertTriangle,
  Users,
  Building,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useUser();
  const [devices, setDevices] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError("");

      try {
        // Use the Next.js API route instead of external API
        const dashboardUrl = `/api/dashboard?clerk_id=${user.id}`;
        console.log(`Fetching dashboard data from: ${dashboardUrl}`);

        const dashboardRes = await fetch(dashboardUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-cache", // Prevent caching issues
        });

        // Process the dashboard data
        if (!dashboardRes.ok) {
          const errorText = await dashboardRes.text();
          throw new Error(
            `API returned status: ${dashboardRes.status} - ${errorText}`
          );
        }

        const dashboardData = await dashboardRes.json();
        console.log(`Dashboard data:`, dashboardData);

        // Set all the state at once from the consolidated response
        setDevices(
          Array.isArray(dashboardData.devices) ? dashboardData.devices : []
        );
        setRecentEvents(
          Array.isArray(dashboardData.recent_events)
            ? dashboardData.recent_events
            : []
        );
        setRecentImages(
          Array.isArray(dashboardData.recent_images)
            ? dashboardData.recent_images
            : []
        );
      } catch (err: any) {
        // Detailed error logging
        console.error("Dashboard data fetch error:", err);

        // Create user-friendly error message
        const errorMessage = err.message || "Unknown error";
        setError(`Could not load dashboard data. ${errorMessage}`);

        // Mock data for development
        if (process.env.NODE_ENV === "development") {
          console.log("Using mock data in development mode");
          setDevices([
            {
              id: 999,
              clerk_id: user.id,
              name: "Main Delivery Hub",
              location: "Building A Lobby",
              is_active: true,
              last_seen: new Date().toISOString(),
            },
          ]);
          setRecentEvents([
            {
              id: 1,
              device_id: 999,
              event_type: "open",
              occurred_at: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Show loading state
  if (isLoading && !devices.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-center">
        <p className="text-red-700">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const currentDevice = devices[0] || null;
  // If no device, prompt to connect one
  if (!currentDevice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-gray-600">No delivery hubs connected yet.</p>
        <Link href="/connect-device">
          <Button>Connect Mailbox</Button>
        </Link>
      </div>
    );
  }

  // Event type display mapping
  const getEventDisplay = (eventType: string) => {
    switch (eventType) {
      case "open":
        return {
          icon: MailOpen,
          text: "Mailbox opened",
          color: "text-blue-500",
        };
      case "close":
        return { icon: Mail, text: "Mailbox closed", color: "text-gray-500" };
      case "delivery":
        return { icon: Mail, text: "Mail delivered", color: "text-green-500" };
      case "removal":
        return { icon: Mail, text: "Mail removed", color: "text-amber-500" };
      default:
        return {
          icon: Clock,
          text: eventType.replace(/_/g, " "),
          color: "text-gray-500",
        };
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link href="/connect-device">
          <Button>Connect Mailbox</Button>
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery Hub Status</CardTitle>
            <CardDescription>Info for {currentDevice.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Serial Number:</strong>{" "}
                {currentDevice.serial_number || "—"}
              </p>
              <p className="text-sm">
                <strong>Location:</strong> {currentDevice.location || "—"}
              </p>
              <p className="text-sm">
                <strong>Last Seen:</strong>{" "}
                {currentDevice.last_seen
                  ? new Date(currentDevice.last_seen).toLocaleString()
                  : "Never"}
              </p>
              <div className="flex items-center gap-2">
                <strong className="text-sm">Status:</strong>
                <Badge
                  variant={currentDevice.is_active ? "default" : "secondary"}
                >
                  {currentDevice.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="justify-start" variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Check delivery status
            </Button>
            <Button className="justify-start" variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Test notification
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events from your delivery hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event, index) => {
                const {
                  icon: IconComponent,
                  text,
                  color,
                } = getEventDisplay(event.event_type);
                return (
                  <div key={event.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${color}`} />
                        <div>
                          <p className="text-sm font-medium">{text}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.occurred_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {(event.event_type === "open" ||
                        event.event_type === "delivery") && (
                        <Button variant="ghost" size="sm" className="text-xs">
                          View Image
                        </Button>
                      )}
                    </div>
                    {index < recentEvents.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })}
              {recentEvents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent activity recorded
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
