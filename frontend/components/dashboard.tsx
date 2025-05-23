"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Mail, MailOpen, Clock, AlertTriangle } from "lucide-react";
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
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const { user } = useUser();
  const [devices, setDevices] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError("");

      try {
        // Log the full URL for debugging
        const devicesUrl = `${API_BASE}/devices?clerk_id=${user.id}`;
        console.log(`Attempting to fetch from: ${devicesUrl}`);

        // Use more robust fetch with CORS mode specified
        const devicesRes = await fetch(devicesUrl, {
          method: "GET",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
        });

        // Process the devices data
        if (!devicesRes.ok) {
          throw new Error(`API returned status: ${devicesRes.status}`);
        }

        const devicesData = await devicesRes.json();
        console.log(`Devices data:`, devicesData);
        setDevices(Array.isArray(devicesData) ? devicesData : []);

        // If we have devices, fetch events for the first one
        if (devicesData && devicesData.length > 0) {
          const deviceId = devicesData[0].id;
          const eventsUrl = `${API_BASE}/mailbox/events?device_id=${deviceId}`;
          console.log(`Fetching events from: ${eventsUrl}`);

          const eventsRes = await fetch(eventsUrl, {
            method: "GET",
            mode: "cors",
            headers: {
              Accept: "application/json",
            },
          });

          if (!eventsRes.ok) {
            console.warn(
              `Events fetch failed with status: ${eventsRes.status}`
            );
            // Don't throw here - just log and continue with empty events
            setRecentEvents([]);
          } else {
            const eventsData = await eventsRes.json();
            console.log(`Events data:`, eventsData);
            setRecentEvents(Array.isArray(eventsData) ? eventsData : []);
          }
        }
      } catch (err: any) {
        // Detailed error logging
        console.error("Dashboard data fetch error:", err);

        // Create user-friendly error message with technical details
        const errorMessage = err.message || "Unknown error";
        setError(
          `Could not connect to the API server. This might be due to CORS restrictions or the server being unavailable. Technical details: ${errorMessage}`
        );

        // Temporary: Use mock data if API is unavailable during development
        if (process.env.NODE_ENV === "development") {
          console.log("Using mock data in development mode");
          setDevices([
            {
              id: 999,
              clerk_id: user.id,
              name: "Demo Mailbox",
              location: "Development Environment",
              is_active: true,
              last_seen: new Date().toISOString(),
            },
          ]);
          setRecentEvents([
            {
              id: 1,
              device_id: 999,
              event_type: "mail_delivered",
              occurred_at: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, API_BASE]);

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
        <p className="mb-4 text-gray-600">No devices connected yet.</p>
        <Link href="/connect-device">
          <Button>Connect Device</Button>
        </Link>
      </div>
    );
  }
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link href="/connect-device">
          <Button>Connect Device</Button>
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Device Status</CardTitle>
            <CardDescription>Info for {currentDevice.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <strong>ID:</strong> {currentDevice.id}
            </p>
            <p className="text-sm">
              <strong>Location:</strong> {currentDevice.location || "—"}
            </p>
            <p className="text-sm">
              <strong>Last Seen:</strong>{" "}
              {new Date(currentDevice.last_seen).toLocaleString()}
            </p>
            <p className="text-sm">
              <strong>Active:</strong> {currentDevice.is_active ? "Yes" : "No"}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions Card (for {currentDevice.name}) */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="justify-start" variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Check for new mail
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
            <CardDescription>Latest events from your mailbox</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <div key={event.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {event.event_type === "mail_delivered" && (
                        <Mail className="h-4 w-4 text-green-500" />
                      )}
                      {event.event_type === "mailbox_opened" && (
                        <MailOpen className="h-4 w-4 text-blue-500" />
                      )}
                      {event.event_type === "mail_removed" && (
                        <Mail className="h-4 w-4 text-amber-500" />
                      )}
                      {event.event_type === "mailbox_closed" && (
                        <Mail className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {event.event_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.occurred_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {(event.event_type === "mailbox_opened" ||
                      event.event_type === "mail_delivered") && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Image
                      </Button>
                    )}
                  </div>
                  {index < recentEvents.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
