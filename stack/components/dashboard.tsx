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
  Flag,
  MapPin,
  Activity,
  Wifi,
  WifiOff,
  Calendar,
  TrendingUp,
  Shield,
  Camera,
  AlertCircle,
  CheckCircle2,
  Zap,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Enhanced stats component
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  isLoading = false,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-6 w-[60px]" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 transition-all hover:shadow-md border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.isPositive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 ${trend.isPositive ? "" : "rotate-180"}`}
            />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Enhanced status indicator
function StatusIndicator({
  isOnline,
  lastSeen,
}: {
  isOnline: boolean;
  lastSeen?: string;
}) {
  const getStatusInfo = () => {
    if (isOnline) {
      return {
        icon: CheckCircle2,
        text: "Online",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    }
    return {
      icon: AlertCircle,
      text: "Offline",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div
      className={`flex items-center space-x-3 p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}
    >
      <div className="relative">
        <StatusIcon className={`h-5 w-5 ${status.color}`} />
        {isOnline && (
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${status.color}`}>{status.text}</p>
        {lastSeen && (
          <p className="text-sm text-gray-500">
            Last seen: {new Date(lastSeen).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
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

  // Community reporting state
  const [showReportForm, setShowReportForm] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [zipCodeError, setZipCodeError] = useState("");

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

  // Zip code validation function
  const validateZipCode = (zip: string): boolean => {
    // US ZIP code validation (5 digits or 5+4 format)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };

  // Handle community report submission
  const handleCommunityReport = async () => {
    if (!zipCode) {
      setZipCodeError("Zip code is required to report to community");
      return;
    }

    if (!validateZipCode(zipCode)) {
      setZipCodeError(
        "Please enter a valid zip code (e.g., 12345 or 12345-6789)"
      );
      return;
    }

    setZipCodeError("");
    setIsSubmittingReport(true);

    try {
      // Check if user is authenticated
      if (!user?.id) {
        throw new Error("Please sign in to submit a community report");
      }

      console.log("Submitting community report:", {
        user_id: user.id,
        zip_code: zipCode,
        has_description: !!reportDescription,
        has_image: !!selectedImage,
      });

      // Submit the report to the API
      const response = await fetch("/api/community-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zip_code: zipCode,
          description: reportDescription,
          image_url: selectedImage,
          // Note: event_id and device_id could be passed if we track which event triggered the report
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to submit report";
        try {
          const errorData = await response.json();
          if (errorData.error === "Authentication required") {
            errorMessage = "Please sign in to submit a community report";
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Community report submitted successfully:", result);

      // Close the modal and redirect to committee page
      setImageModalOpen(false);
      setShowReportForm(false);
      setSelectedImage(null);

      // Redirect to committee page with the actual report data
      const reportData = {
        id: result.report_id || `temp_${Date.now()}`,
        zipCode,
        description: reportDescription,
        timestamp: new Date().toISOString(),
        imageUrl: selectedImage,
        status: "pending",
      };

      router.push(
        `/dashboard/committee?report=${encodeURIComponent(
          JSON.stringify(reportData)
        )}`
      );
    } catch (error) {
      console.error("Error submitting report:", error);

      // Check if it's an authentication error - offer to continue without API
      if (error instanceof Error && error.message.includes("sign in")) {
        setZipCodeError(error.message);
      } else if (
        error instanceof Error &&
        (error.message.includes("Authentication required") ||
          error.message.includes("401"))
      ) {
        // For authentication errors, still allow user to view their report locally
        console.log(
          "API authentication failed, proceeding with local report only"
        );

        // Close the modal and redirect to committee page
        setImageModalOpen(false);
        setShowReportForm(false);
        setSelectedImage(null);

        // Create local report data (won't be saved to database)
        const reportData = {
          id: `local_${Date.now()}`,
          zipCode,
          description: reportDescription,
          timestamp: new Date().toISOString(),
          imageUrl: selectedImage,
          status: "pending",
        };

        router.push(
          `/dashboard/committee?report=${encodeURIComponent(
            JSON.stringify(reportData)
          )}`
        );

        return; // Don't show error message if we successfully redirect
      } else {
        setZipCodeError(
          error instanceof Error
            ? error.message
            : "Failed to submit report. Please try again."
        );
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Reset report form when modal closes
  const handleModalClose = (open: boolean) => {
    setImageModalOpen(open);
    if (!open) {
      setSelectedImage(null);
      setShowReportForm(false);
      setZipCode("");
      setReportDescription("");
      setZipCodeError("");
    }
  };

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
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[100px]" />
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} icon={Activity} label="" value="" isLoading />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <p>{error}</p>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="w-fit"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Try Again"}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const currentDevice = devices[0] || null;

  // If no device, prompt to connect one
  if (!currentDevice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to Mail Guard
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Connect your IoT mailbox monitoring device to start tracking
            deliveries, securing your mail, and staying informed about mailbox
            activity.
          </p>
          <div className="space-y-4">
            <Link href="/connect-device">
              <Button size="lg" className="w-full sm:w-auto">
                <Building className="mr-2 h-4 w-4" />
                Connect Your Device
              </Button>
            </Link>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Secure
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Real-time
              </div>
              <div className="flex items-center">
                <Camera className="h-4 w-4 mr-1" />
                Smart alerts
              </div>
            </div>
          </div>
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
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "close":
        return {
          icon: Mail,
          text: "Mailbox closed",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
      case "delivery":
        return {
          icon: Mail,
          text: "Mail delivered",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "removal":
        return {
          icon: Mail,
          text: "Mail removed",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        };
      default:
        return {
          icon: Clock,
          text: eventType.replace(/_/g, " "),
          color: "text-gray-600",
          bgColor: "bg-gray-50",
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

  // Calculate some stats
  const todayEvents = recentEvents.filter((event) => {
    const eventDate = new Date(event.occurred_at).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  });

  const deliveryEvents = recentEvents.filter(
    (event) => event.event_type === "delivery"
  );
  const isDeviceOnline = currentDevice.is_online ?? currentDevice.is_active;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor your {currentDevice.name} delivery hub
          </p>
          {lastUpdateTime && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Today's Events"
          value={todayEvents.length}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          icon={Mail}
          label="Total Deliveries"
          value={deliveryEvents.length}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          icon={isDeviceOnline ? Wifi : WifiOff}
          label="Device Status"
          value={isDeviceOnline ? "Online" : "Offline"}
        />
        <StatCard
          icon={Camera}
          label="Images Captured"
          value={recentImages.length}
        />
      </div>

      {/* Device Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Device Information
            </CardTitle>
            <CardDescription>
              Monitoring hub: {currentDevice.name}
            </CardDescription>
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
        <CardContent className="space-y-6">
          <StatusIndicator
            isOnline={isDeviceOnline}
            lastSeen={currentDevice.iot_last_seen || currentDevice.last_seen}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Serial Number
              </Label>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded border">
                {currentDevice.serial_number || "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Location
              </Label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {currentDevice.location || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
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
                bgColor,
              } = getEventDisplay(event.event_type);
              const hasImage = findImageForEvent(event);

              return (
                <div key={event.id}>
                  <div className="flex items-start justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{text}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.occurred_at).toLocaleString()}
                        </div>
                        {event.source === "iot" && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Wifi className="h-3 w-3" />
                            IoT Device: {event.serial_number}
                          </div>
                        )}
                      </div>
                    </div>
                    {event.event_type === "delivery" && (
                      <Button
                        variant={hasImage ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleViewImage(event)}
                        disabled={!hasImage}
                        className="shrink-0"
                      >
                        <Eye className="mr-2 h-3 w-3" />
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
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No recent activity
                </p>
                <p className="text-gray-400 text-sm">
                  Events will appear here when your device detects activity
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Event Capture
            </DialogTitle>
            <DialogDescription>
              Review captured image and report to your community if needed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Enhanced Image Display */}
            {selectedImage && (
              <div className="relative bg-gray-50 rounded-lg p-4">
                <div className="flex justify-center">
                  <img
                    src={selectedImage}
                    alt="Event captured image"
                    className="max-w-full max-h-[50vh] object-contain rounded-lg border shadow-sm"
                    onError={(e) => {
                      console.error("Image failed to load:", selectedImage);
                      e.currentTarget.style.display = "none";
                      const errorDiv = document.createElement("div");
                      errorDiv.className =
                        "flex flex-col items-center justify-center text-gray-500 p-12";
                      errorDiv.innerHTML = `
                        <div class="bg-gray-100 rounded-full p-4 mb-4">
                          <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                          </svg>
                        </div>
                        <p class="font-medium">Image could not be loaded</p>
                        <p class="text-xs mt-2 opacity-75">Please try refreshing or contact support</p>
                      `;
                      e.currentTarget.parentNode?.appendChild(errorDiv);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showReportForm && (
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowReportForm(true)}
                  className="flex items-center gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Report to Community
                </Button>
              </div>
            )}

            {/* Enhanced Community Report Form */}
            {showReportForm && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Flag className="h-5 w-5" />
                    Report to Community Committee
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Help keep your community safe by reporting suspicious
                    activity to the local committee.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Zip Code Input */}
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm font-medium">
                      Your Zip Code *
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="12345 or 12345-6789"
                        value={zipCode}
                        onChange={(e) => {
                          setZipCode(e.target.value);
                          setZipCodeError("");
                        }}
                        maxLength={10}
                        className={`pl-10 ${
                          zipCodeError ? "border-red-500" : ""
                        }`}
                      />
                      {zipCodeError && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {zipCodeError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="reportDescription"
                      className="text-sm font-medium"
                    >
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="reportDescription"
                      placeholder="Describe what you observed in this image..."
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowReportForm(false)}
                      disabled={isSubmittingReport}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCommunityReport}
                      disabled={isSubmittingReport || !zipCode}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isSubmittingReport ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Flag className="mr-2 h-4 w-4" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
