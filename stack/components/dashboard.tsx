"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Mail,
  MailOpen,
  Clock,
  AlertTriangle,
  Users,
  Building,
  X,
  Eye,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useUser();
  const [devices, setDevices] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Auto-refresh setup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL = 30000; // 30 seconds

  const loadDashboardData = useCallback(
    async (isManualRefresh = false) => {
      if (!user?.id) return;

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else if (!devices.length) {
        setIsLoading(true);
      }
      setError("");

      try {
        const dashboardUrl = `/api/dashboard?clerk_id=${
          user.id
        }&t=${Date.now()}`;
        console.log(`Fetching dashboard data from: ${dashboardUrl}`);

        const dashboardRes = await fetch(dashboardUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-cache",
        });

        if (!dashboardRes.ok) {
          const errorText = await dashboardRes.text();
          throw new Error(
            `API returned status: ${dashboardRes.status} - ${errorText}`
          );
        }

        const dashboardData = await dashboardRes.json();
        console.log(`Dashboard data:`, dashboardData);

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
        setLastUpdateTime(new Date());
      } catch (err: any) {
        console.error("Dashboard data fetch error:", err);
        const errorMessage = err.message || "Unknown error";
        setError(`Could not load dashboard data. ${errorMessage}`);

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
        setIsRefreshing(false);
      }
    },
    [user?.id, devices.length]
  );

  const handleManualRefresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  useEffect(() => {
    // Initial load
    loadDashboardData();

    // Set up auto-refresh
    intervalRef.current = setInterval(() => {
      loadDashboardData();
    }, POLLING_INTERVAL);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadDashboardData]);

  const handleRemoveDevice = async () => {
    if (!currentDevice || !user?.id) return;

    const confirmRemoval = window.confirm(
      `Are you sure you want to remove "${currentDevice.name}"? This will disconnect the device from your dashboard.`
    );

    if (!confirmRemoval) return;

    setIsRemoving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/devices/${currentDevice.id}?clerk_id=${user.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove device");
      }

      // Refresh the dashboard data to show no device state
      setDevices([]);
      setRecentEvents([]);
      setRecentImages([]);

      // Optional: Show success message
      console.log("Device removed successfully");
    } catch (err: any) {
      console.error("Error removing device:", err);
      setError(`Failed to remove device: ${err.message}`);
    } finally {
      setIsRemoving(false);
    }
  };

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
          onClick={handleManualRefresh}
          className="mt-4"
          variant="outline"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Try Again"}
        </Button>
      </div>
    );
  }

  const currentDevice = devices[0] || null;
  // If no device, prompt to connect one
  if (!currentDevice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Device Connected
          </h3>
          <p className="mb-6 text-gray-600 max-w-sm">
            Connect your IoT mailbox monitoring device to start tracking
            deliveries and events.
          </p>
          <Link href="/connect-device">
            <Button size="lg">
              <Building className="mr-2 h-4 w-4" />
              Connect IoT Device
            </Button>
          </Link>
        </div>
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

  const findImageForEvent = (event: any) => {
    // Try to find image for this event
    const eventTime = new Date(event.occurred_at);

    // Look for images within 5 minutes of this event
    const matchingImages = recentImages.filter((img) => {
      const imgTime = new Date(img.captured_at);
      const timeDiff = Math.abs(eventTime.getTime() - imgTime.getTime());
      const fiveMinutes = 5 * 60 * 1000;

      // Check if image is close in time and matches device/serial
      const timeMatch = timeDiff <= fiveMinutes;

      // Check device matching with multiple strategies
      let deviceMatch = false;

      if (event.device_id && img.device_id) {
        deviceMatch = event.device_id === img.device_id;
      }

      if (!deviceMatch && event.serial_number && img.serial_number) {
        deviceMatch = event.serial_number === img.serial_number;
      }

      if (
        !deviceMatch &&
        event.device_id &&
        typeof event.device_id === "string" &&
        event.device_id.startsWith("iot_")
      ) {
        const eventSerial = event.device_id.replace("iot_", "");
        deviceMatch = img.serial_number === eventSerial;
      }

      return timeMatch && deviceMatch;
    });

    // Return the closest image
    if (matchingImages.length > 0) {
      return matchingImages.sort((a, b) => {
        const aTime = Math.abs(
          eventTime.getTime() - new Date(a.captured_at).getTime()
        );
        const bTime = Math.abs(
          eventTime.getTime() - new Date(b.captured_at).getTime()
        );
        return aTime - bTime;
      })[0];
    }

    return null;
  };

  const handleViewImage = (event: any) => {
    const image = findImageForEvent(event);
    if (image) {
      // Use the image proxy endpoint instead of direct S3 URL
      const imageId = image.source === "iot" ? `iot_${image.id}` : image.id;
      const proxyUrl = `/api/image/${imageId}`;

      console.log("Opening image modal:", {
        event: event.event_type,
        imageId,
        proxyUrl,
        originalImage: image,
      });

      setSelectedImage(proxyUrl);
      setImageModalOpen(true);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {lastUpdateTime && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Link href="/connect-device">
            <Button variant="outline">
              <Building className="mr-2 h-4 w-4" />
              Connect Another Device
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Delivery Hub Status</CardTitle>
              <CardDescription>Info for {currentDevice.name}</CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveDevice}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Device"}
            </Button>
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
                const hasImage = findImageForEvent(event);

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
                          {event.source === "iot" && (
                            <p className="text-xs text-blue-600">
                              IoT Device: {event.serial_number}
                            </p>
                          )}
                        </div>
                      </div>
                      {event.event_type === "delivery" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleViewImage(event)}
                          disabled={!hasImage}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          {hasImage ? "View Image" : "No Image"}
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

      {/* Image Modal */}
      <Dialog
        open={imageModalOpen}
        onOpenChange={(open) => {
          setImageModalOpen(open);
          if (!open) {
            // Clear selected image when modal closes
            setSelectedImage(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Event Image</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Event captured image"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    console.error("Image failed to load:", selectedImage);
                    console.error(
                      "This should be a proxy URL like /api/image/123, not a direct S3 URL"
                    );
                    e.currentTarget.style.display = "none";
                    // Show error message
                    const errorDiv = document.createElement("div");
                    errorDiv.className = "text-center text-gray-500 p-8";
                    errorDiv.innerHTML = `
                      <p>Image could not be loaded</p>
                      <p class="text-xs mt-2">URL: ${selectedImage}</p>
                      <p class="text-xs">Expected format: /api/image/123</p>
                    `;
                    e.currentTarget.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
