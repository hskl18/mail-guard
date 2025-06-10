"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Bell,
  Filter,
  Mail,
  MailOpen,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Notifications() {
  const { user } = useUser();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);

  // Function to find image for a notification (similar to dashboard)
  const findImageForNotification = (notification: any) => {
    if (!images.length) return null;

    const notificationTime = new Date(notification.sent_at);

    // Look for images within 5 minutes of this notification
    const matchingImages = images.filter((img) => {
      const imgTime = new Date(img.captured_at);
      const timeDiff = Math.abs(notificationTime.getTime() - imgTime.getTime());
      const fiveMinutes = 5 * 60 * 1000;

      // Check if image is close in time and matches device
      const timeMatch = timeDiff <= fiveMinutes;

      // Check device matching
      let deviceMatch = false;

      if (notification.device_id && img.device_id) {
        deviceMatch = notification.device_id === img.device_id;
      }

      if (
        !deviceMatch &&
        notification.device_id &&
        typeof notification.device_id === "string" &&
        notification.device_id.startsWith("iot_")
      ) {
        const notificationSerial = notification.device_id.replace("iot_", "");
        deviceMatch = img.serial_number === notificationSerial;
      }

      return timeMatch && deviceMatch;
    });

    // Return the closest image
    if (matchingImages.length > 0) {
      return matchingImages.sort((a, b) => {
        const aTime = Math.abs(
          notificationTime.getTime() - new Date(a.captured_at).getTime()
        );
        const bTime = Math.abs(
          notificationTime.getTime() - new Date(b.captured_at).getTime()
        );
        return aTime - bTime;
      })[0];
    }

    return null;
  };

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError("");

      // Clear previous state when reloading
      setDevices([]);
      setNotifications([]);
      setImages([]);

      try {
        // Use the Next.js API route for dashboard data
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
          throw new Error(
            `Failed to fetch dashboard data: ${dashboardRes.status}`
          );
        }

        const dashboardData = await dashboardRes.json();
        console.log("Dashboard data:", dashboardData);
        console.log("Events count:", dashboardData.recent_events?.length || 0);
        console.log("Images count:", dashboardData.recent_images?.length || 0);

        // Extract and process devices
        const devicesData = Array.isArray(dashboardData.devices)
          ? dashboardData.devices
          : [];
        setDevices(devicesData);

        // Extract and process events
        const eventsData = Array.isArray(dashboardData.recent_events)
          ? dashboardData.recent_events
          : [];

        // Extract and process images - store as array
        const imagesData = Array.isArray(dashboardData.recent_images)
          ? dashboardData.recent_images
          : [];
        setImages(imagesData);

        // Convert events to notification format
        const allNotifications: any[] = [];

        // Process events to match the notification format
        eventsData.forEach((event: any) => {
          // Handle both regular events and IoT events
          let device = null;
          let deviceName = "Unknown Device";
          let deviceLocation = "";

          if (event.device_id && typeof event.device_id === "number") {
            // Regular dashboard event - find matching device
            device = devicesData.find((d: any) => d.id === event.device_id);
            if (device) {
              deviceName =
                device.name || device.serial_number || "Unknown Device";
              deviceLocation = device.location || "";
            }
          } else if (event.device_name) {
            // IoT event - use provided device info
            deviceName = event.device_name;
            deviceLocation = event.device_location || "";
          } else if (event.serial_number) {
            // IoT event with serial - try to find matching device
            device = devicesData.find(
              (d: any) => d.serial_number === event.serial_number
            );
            if (device) {
              deviceName = device.name || device.serial_number;
              deviceLocation = device.location || "";
            } else {
              deviceName = `IoT Device (${event.serial_number})`;
              deviceLocation = "Serial: " + event.serial_number;
            }
          }

          // Always create notification, even if device not found
          allNotifications.push({
            id: `event_${event.id}`,
            device_id: event.device_id || `iot_${event.serial_number}`,
            deviceName: deviceName,
            deviceLocation: deviceLocation,
            type: event.event_type,
            notification_type: event.event_type,
            time: new Date(event.occurred_at).toLocaleString(),
            sent_at: event.occurred_at,
            message: getNotificationMessage(event.event_type, deviceName),
            read: true,
            hasImage:
              event.event_type === "delivery" ||
              event.event_type === "mail_delivered",
          });
        });

        // Sort notifications by date (newest first)
        allNotifications.sort(
          (a, b) =>
            new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
        );

        setNotifications(allNotifications);
        console.log("Processed notifications:", allNotifications.length);
        console.log("Sample notifications:", allNotifications.slice(0, 3));
      } catch (err: any) {
        console.error("Failed to load notifications:", err);
        setError(`Error loading notifications: ${err.message}`);

        // Use mock data in development for easier UI testing
        if (process.env.NODE_ENV === "development") {
          console.log("Using mock notifications data in development");
          setNotifications([
            {
              id: 1,
              type: "mail_delivered",
              notification_type: "mail_delivered",
              time: new Date().toLocaleString(),
              sent_at: new Date().toISOString(),
              message: "Mail delivered to your mailbox",
              read: false,
              hasImage: true,
              deviceName: "Demo Mailbox",
            },
            {
              id: 2,
              type: "open",
              notification_type: "open",
              time: new Date(Date.now() - 3600000).toLocaleString(),
              sent_at: new Date(Date.now() - 3600000).toISOString(),
              message: "Your mailbox was opened",
              read: true,
              hasImage: true,
              deviceName: "Demo Mailbox",
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  // Add a focus event listener to refresh data when the notifications tab becomes visible
  useEffect(() => {
    const handleFocus = () => {
      // If we have no devices, it might be because a device was deleted in another tab
      if (user?.id && devices.length === 0 && !isLoading) {
        console.log(
          "Notifications tab focused with no devices - refreshing data"
        );
        // Re-run the load function by triggering a re-render
        window.location.reload();
      }
    };

    // Use both focus and visibility change events for better coverage
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [user?.id, devices.length, isLoading]);

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter(
          (n) => n.type === filter || n.notification_type === filter
        );

  const openImageDialog = (notification: any) => {
    const image = findImageForNotification(notification);
    if (image) {
      // Use the image proxy endpoint instead of direct S3 URL
      const imageId = image.source === "iot" ? `iot_${image.id}` : image.id;
      const proxyUrl = `/api/image/${imageId}`;

      console.log("Opening notification image via proxy:", {
        notification: notification.type,
        imageId,
        proxyUrl,
        originalImage: image,
      });

      setSelectedImage(proxyUrl);
    } else {
      console.log("No image found for notification:", notification.id);
      setSelectedImage("/placeholder.svg?height=400&width=600");
    }
  };

  // Show loading state
  if (isLoading && !notifications.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
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

  return (
    <div>
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Activity Notifications</CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="mail_delivered">Mail Delivered</SelectItem>
                  <SelectItem value="open">Mailbox Opened</SelectItem>
                  <SelectItem value="close">Mailbox Closed</SelectItem>
                  <SelectItem value="mail_removed">Mail Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 flex items-start justify-between hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-2 rounded-full ${getNotificationIconBackground(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">
                        {notification.message}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {notification.deviceName}
                        {notification.deviceLocation
                          ? ` • ${notification.deviceLocation}`
                          : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notification.time}
                      </p>
                    </div>
                  </div>

                  {notification.hasImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => openImageDialog(notification)}
                    >
                      <ImageIcon className="h-3 w-3 mr-1" /> View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-medium">No notifications</h3>
              <p className="text-sm text-gray-500">
                When events occur, you'll see them here
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-between">
          <Button variant="ghost" size="sm" disabled>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>

      {/* Image dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Captured Image</DialogTitle>
            <DialogDescription>
              Image captured by your delivery hub
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Captured mailbox image"
                className="max-h-[60vh] object-contain rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getNotificationMessage(
  type: string,
  deviceName: string = "your mailbox"
) {
  switch (type) {
    case "mail_delivered":
      return `Mail delivered to ${deviceName}`;
    case "open":
      return `${deviceName} was opened`;
    case "close":
      return `${deviceName} was closed`;
    case "mail_removed":
      return `Mail removed from ${deviceName}`;
    case "battery_low":
      return `Low battery alert for ${deviceName}`;
    default:
      return `${type} event from ${deviceName}`;
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "mail_delivered":
      return <Mail className="h-4 w-4 text-white" />;
    case "open":
      return <MailOpen className="h-4 w-4 text-white" />;
    case "close":
      return <Mail className="h-4 w-4 text-white" />;
    case "mail_removed":
      return <Mail className="h-4 w-4 text-white" />;
    case "battery_low":
      return <AlertTriangle className="h-4 w-4 text-white" />;
    default:
      return <Bell className="h-4 w-4 text-white" />;
  }
}

function getNotificationIconBackground(type: string) {
  switch (type) {
    case "mail_delivered":
      return "bg-green-500";
    case "open":
      return "bg-blue-500";
    case "close":
      return "bg-gray-500";
    case "mail_removed":
      return "bg-amber-500";
    case "battery_low":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}
