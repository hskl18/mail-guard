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
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const { user } = useUser();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [images, setImages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError("");

      try {
        // First fetch devices
        const devicesUrl = `${API_BASE}/devices?clerk_id=${user.id}`;
        console.log(`Fetching devices from: ${devicesUrl}`);

        const devicesRes = await fetch(devicesUrl, {
          method: "GET",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
        });

        if (!devicesRes.ok) {
          throw new Error(`Failed to fetch devices: ${devicesRes.status}`);
        }

        const devicesData = await devicesRes.json();
        console.log("Devices data:", devicesData);
        setDevices(Array.isArray(devicesData) ? devicesData : []);

        // If we have devices, fetch notifications for each
        if (devicesData && devicesData.length > 0) {
          const allNotifications: any[] = [];

          // For each device, fetch its notifications
          for (const device of devicesData) {
            const notifUrl = `${API_BASE}/mailbox/notifications?device_id=${device.id}`;
            console.log(`Fetching notifications from: ${notifUrl}`);

            const notifRes = await fetch(notifUrl, {
              method: "GET",
              mode: "cors",
              headers: {
                Accept: "application/json",
              },
            });

            if (notifRes.ok) {
              const deviceNotifications = await notifRes.json();
              console.log(
                `Got ${deviceNotifications.length} notifications for device ${device.id}`
              );

              // Enrich notifications with device info
              const enrichedNotifications = deviceNotifications.map(
                (n: any) => ({
                  ...n,
                  deviceName: device.name,
                  deviceLocation: device.location,
                  // Convert notification_type to type for backward compatibility with UI
                  type: n.notification_type,
                  time: new Date(n.sent_at).toLocaleString(),
                  message: getNotificationMessage(
                    n.notification_type,
                    device.name
                  ),
                })
              );

              allNotifications.push(...enrichedNotifications);
            }

            // Also fetch events (which can be treated as another type of notification)
            const eventsUrl = `${API_BASE}/mailbox/events?device_id=${device.id}`;
            const eventsRes = await fetch(eventsUrl, {
              method: "GET",
              mode: "cors",
              headers: {
                Accept: "application/json",
              },
            });

            if (eventsRes.ok) {
              const deviceEvents = await eventsRes.json();
              console.log(
                `Got ${deviceEvents.length} events for device ${device.id}`
              );

              // Convert events to notification format
              const eventNotifications = deviceEvents.map((e: any) => ({
                id: `event_${e.id}`,
                device_id: e.device_id,
                deviceName: device.name,
                deviceLocation: device.location,
                type: e.event_type,
                notification_type: e.event_type,
                time: new Date(e.occurred_at).toLocaleString(),
                sent_at: e.occurred_at,
                message: getNotificationMessage(e.event_type, device.name),
                read: true,
                hasImage:
                  e.event_type === "open" || e.event_type === "mail_delivered",
              }));

              allNotifications.push(...eventNotifications);
            }

            // Try to fetch images for this device
            try {
              const imagesUrl = `${API_BASE}/mailbox/images?device_id=${device.id}`;
              const imageRes = await fetch(imagesUrl, {
                method: "GET",
                mode: "cors",
                headers: {
                  Accept: "application/json",
                },
              });

              if (imageRes.ok) {
                const imageData = await imageRes.json();
                // Store the image URL for this device
                if (Array.isArray(imageData) && imageData.length > 0) {
                  const deviceImages = imageData.reduce(
                    (acc: any, img: any) => {
                      acc[img.device_id] = img.image_url;
                      return acc;
                    },
                    {}
                  );
                  setImages((prev) => ({ ...prev, ...deviceImages }));
                }
              }
            } catch (imgErr) {
              console.warn("Failed to fetch images:", imgErr);
            }
          }

          // Sort notifications by date (newest first)
          allNotifications.sort(
            (a, b) =>
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
          );

          setNotifications(allNotifications);
        }
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
  }, [user, API_BASE]);

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter(
          (n) => n.type === filter || n.notification_type === filter
        );

  const openImageDialog = (deviceId: number) => {
    const imageUrl = images[deviceId];
    if (imageUrl) {
      setSelectedImage(imageUrl);
    } else {
      // Fallback to placeholder
      setSelectedImage("/placeholder.svg?height=400&width=600");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent alerts from your mailbox</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notifications</SelectItem>
                  <SelectItem value="mail_delivered">Mail delivered</SelectItem>
                  <SelectItem value="open">Mailbox opened</SelectItem>
                  <SelectItem value="close">Mailbox closed</SelectItem>
                  <SelectItem value="battery_low">Battery alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-sm text-gray-500 mt-1">
                  There are no notifications matching your current filter.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full ${getNotificationIconBackground(
                        notification.type || notification.notification_type
                      )}`}
                    >
                      {getNotificationIcon(
                        notification.type || notification.notification_type
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {notification.time}
                            </p>
                            {notification.deviceName && (
                              <Badge variant="outline" className="text-xs">
                                {notification.deviceName}
                              </Badge>
                            )}
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        {notification.hasImage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              openImageDialog(notification.device_id)
                            }
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
        {notifications.length > 10 && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Image Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Captured Image</DialogTitle>
            <DialogDescription>
              Image captured when your mailbox was accessed
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-video overflow-hidden rounded-md">
              <img
                src={selectedImage}
                alt="Mailbox capture"
                className="object-cover w-full"
              />
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedImage(null)}>
              Close
            </Button>
          </div>
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
    case "battery_low":
      return `Battery level is low for ${deviceName}`;
    default:
      return `Event detected: ${type} (${deviceName})`;
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
      return "bg-amber-500";
    case "battery_low":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}
