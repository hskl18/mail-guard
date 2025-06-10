"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Bell,
  Wifi,
  Shield,
  Save,
  Mail,
  AlertTriangle,
  UserIcon,
  Settings as SettingsIcon,
  Camera,
  Clock,
  CheckCircle2,
  Smartphone,
  Monitor,
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [currentDevice, setCurrentDevice] = useState<any>(null);

  // Notification settings with defaults that will be overridden by API data
  const [notificationSettings, setNotificationSettings] = useState({
    mail_delivered_notify: true,
    mailbox_opened_notify: true,
    mail_removed_notify: true,
    email_notifications: true,
  });

  // Device settings with defaults that will be overridden by API data
  const [deviceSettings, setDeviceSettings] = useState({
    name: "",
    location: "",
    check_interval: "15",
    capture_image_on_open: true,
    capture_image_on_delivery: true,
  });

  // Function to load settings data
  const loadSettings = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError("");

    // Clear previous device state when reloading
    setDevices([]);
    setCurrentDevice(null);

    try {
      // Use the Next.js API route for dashboard data
      const dashboardUrl = `/api/dashboard?clerk_id=${user.id}&t=${Date.now()}`;
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

      const devicesList = Array.isArray(dashboardData.devices)
        ? dashboardData.devices
        : [];
      setDevices(devicesList);

      // If we have devices, load settings for the first one
      if (devicesList.length > 0) {
        const device = devicesList[0];
        setCurrentDevice(device);

        // Set basic device info
        setDeviceSettings((prev) => ({
          ...prev,
          name: device.name || "",
          location: device.location || "",
        }));

        // Extract settings from the device object directly if available
        // This avoids an extra API call if the dashboard data already contains these settings
        if (device) {
          setNotificationSettings({
            mail_delivered_notify: Boolean(
              device.mail_delivered_notify ?? true
            ),
            mailbox_opened_notify: Boolean(
              device.mailbox_opened_notify ?? true
            ),
            mail_removed_notify: Boolean(device.mail_removed_notify ?? true),
            email_notifications: Boolean(device.email_notifications ?? true),
          });

          setDeviceSettings((prev) => ({
            ...prev,
            check_interval: String(device.check_interval ?? 15),
            capture_image_on_open: Boolean(
              device.capture_image_on_open ?? true
            ),
            capture_image_on_delivery: Boolean(
              device.capture_image_on_delivery ?? true
            ),
          }));
        } else {
          // If full settings aren't available in the dashboard response, fetch detailed settings
          await loadDeviceSettings(device.id, user.id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      setError(`Error loading settings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load devices and settings on component mount
  useEffect(() => {
    loadSettings();
  }, [user]);

  // Add a focus event listener to refresh data when the settings tab becomes visible
  useEffect(() => {
    const handleFocus = () => {
      // If we have no devices, it might be because a device was deleted in another tab
      if (user?.id && devices.length === 0 && !isLoading) {
        console.log("Settings tab focused with no devices - refreshing data");
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

  // Function to load device settings (only used if not already available in dashboard data)
  const loadDeviceSettings = async (deviceId: number, clerkId: string) => {
    try {
      const settingsUrl = `/api/devices/${deviceId}/settings?clerk_id=${clerkId}`;
      console.log(`Fetching device settings from: ${settingsUrl}`);

      const settingsRes = await fetch(settingsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!settingsRes.ok) {
        throw new Error(`Failed to fetch settings: ${settingsRes.status}`);
      }

      const settingsData = await settingsRes.json();
      console.log("Settings data:", settingsData);

      // Update notification settings
      setNotificationSettings({
        mail_delivered_notify: Boolean(
          settingsData.mail_delivered_notify ?? true
        ),
        mailbox_opened_notify: Boolean(
          settingsData.mailbox_opened_notify ?? true
        ),
        mail_removed_notify: Boolean(settingsData.mail_removed_notify ?? true),
        email_notifications: Boolean(settingsData.email_notifications ?? true),
      });

      // Update device settings
      setDeviceSettings((prev) => ({
        ...prev,
        check_interval: String(settingsData.check_interval ?? 15),
        capture_image_on_open: Boolean(
          settingsData.capture_image_on_open ?? true
        ),
        capture_image_on_delivery: Boolean(
          settingsData.capture_image_on_delivery ?? true
        ),
      }));
    } catch (err: any) {
      console.error("Failed to load device settings:", err);
      // Don't set global error, just log
    }
  };

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key],
    });
  };

  const handleDeviceSettingChange = (
    key: keyof typeof deviceSettings,
    value: string | boolean
  ) => {
    setDeviceSettings({
      ...deviceSettings,
      [key]: value,
    });
  };

  const saveSettings = async () => {
    if (!currentDevice || !user?.id) return;

    setSaving(true);

    try {
      // Save notification settings
      const settingsPayload = {
        clerk_id: user.id,
        mail_delivered_notify: notificationSettings.mail_delivered_notify,
        mailbox_opened_notify: notificationSettings.mailbox_opened_notify,
        mail_removed_notify: notificationSettings.mail_removed_notify,
        email_notifications: notificationSettings.email_notifications,
        check_interval: parseInt(deviceSettings.check_interval, 10),
        capture_image_on_open: deviceSettings.capture_image_on_open,
        capture_image_on_delivery: deviceSettings.capture_image_on_delivery,
      };

      // Update device settings
      const settingsUrl = `/api/devices/${currentDevice.id}/settings`;
      const settingsRes = await fetch(settingsUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsPayload),
      });

      if (!settingsRes.ok) {
        throw new Error(`Failed to save settings: ${settingsRes.status}`);
      }

      // If name or location changed, update device properties too
      if (
        deviceSettings.name !== currentDevice.name ||
        deviceSettings.location !== currentDevice.location
      ) {
        const devicePayload = {
          clerk_id: user.id,
          name: deviceSettings.name,
          location: deviceSettings.location,
          is_active: currentDevice.is_active,
        };

        const deviceUrl = `/api/devices/${currentDevice.id}`;
        const deviceRes = await fetch(deviceUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(devicePayload),
        });

        if (!deviceRes.ok) {
          throw new Error(`Failed to update device: ${deviceRes.status}`);
        }
      }

      toast.success("Settings saved successfully", {
        description: "Your preferences have been updated.",
      });
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Content skeleton */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-3 w-[200px]" />
                      </div>
                      <Skeleton className="h-6 w-10" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <p>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-fit"
            >
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If no devices, show a message
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
            <SettingsIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No Device Connected
          </h3>
          <p className="text-gray-600 mb-8">
            Connect your IoT mailbox monitoring device to configure settings.
          </p>
          <Button onClick={() => (window.location.href = "/connect-device")}>
            Connect Device
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your device preferences and account settings
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="device" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Device
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>

          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications about your
                mailbox activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Event Notifications
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <Label
                          htmlFor="mail-delivered"
                          className="text-base font-medium"
                        >
                          Mail delivered
                        </Label>
                        <p className="text-sm text-gray-600">
                          Get notified when new mail arrives in your mailbox
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="mail-delivered"
                      checked={notificationSettings.mail_delivered_notify}
                      onCheckedChange={() =>
                        handleNotificationChange("mail_delivered_notify")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Wifi className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <Label
                          htmlFor="mailbox-opened"
                          className="text-base font-medium"
                        >
                          Mailbox opened
                        </Label>
                        <p className="text-sm text-gray-600">
                          Get alerted when someone opens your mailbox
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="mailbox-opened"
                      checked={notificationSettings.mailbox_opened_notify}
                      onCheckedChange={() =>
                        handleNotificationChange("mailbox_opened_notify")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <Label
                          htmlFor="mail-removed"
                          className="text-base font-medium"
                        >
                          Mail removed
                        </Label>
                        <p className="text-sm text-gray-600">
                          Get notified when mail is collected from your mailbox
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="mail-removed"
                      checked={notificationSettings.mail_removed_notify}
                      onCheckedChange={() =>
                        handleNotificationChange("mail_removed_notify")
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delivery Methods
                </h3>
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Mail className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <Label
                            htmlFor="email-notifications"
                            className="text-base font-medium"
                          >
                            Enable email notifications
                          </Label>
                          <p className="text-sm text-gray-600">
                            Receive email alerts for the events you've selected
                            above
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notificationSettings.email_notifications}
                        onCheckedChange={() =>
                          handleNotificationChange("email_notifications")
                        }
                      />
                    </div>

                    {notificationSettings.email_notifications && (
                      <Alert className="mt-4 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Email notifications are enabled. You'll receive emails
                          at{" "}
                          <strong>
                            {user?.primaryEmailAddress?.emailAddress}
                          </strong>{" "}
                          for the selected events.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!notificationSettings.email_notifications && (
                      <Alert className="mt-4 border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-700">
                          Email notifications are disabled. You won't receive
                          any email alerts for mailbox events.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="ml-auto"
                onClick={saveSettings}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="device">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device Settings
              </CardTitle>
              <CardDescription>
                Configure your Smart Mailbox Monitor device preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Device Information
                </h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="device-name"
                      className="text-base font-medium"
                    >
                      Device Name
                    </Label>
                    <Input
                      id="device-name"
                      value={deviceSettings.name}
                      onChange={(e) =>
                        handleDeviceSettingChange("name", e.target.value)
                      }
                      placeholder="Enter device name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-base font-medium">
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={deviceSettings.location}
                      onChange={(e) =>
                        handleDeviceSettingChange("location", e.target.value)
                      }
                      placeholder="e.g., Front door, Building A"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="ml-auto"
                onClick={saveSettings}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your Mail Guard account and profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Profile Information
                </h3>
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {user?.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt="Profile"
                            className="h-16 w-16 rounded-full border-2 border-gray-200"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                            <UserIcon className="h-8 w-8 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {user?.fullName || user?.username}
                          </p>
                          <p className="text-sm text-gray-600">
                            {user?.primaryEmailAddress?.emailAddress}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Member since{" "}
                            {new Date(
                              user?.createdAt || ""
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => openUserProfile()}
                        className="flex items-center"
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Manage Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Management
                </h3>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Manage your account details, profile information, and
                    security settings through Clerk's secure user management
                    portal.
                  </p>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Account Features
                      </h4>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Update personal information and profile picture
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Change password or set up passwordless login
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Enable two-factor authentication for security
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Manage connected social accounts
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          View login history and active sessions
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={() => openUserProfile()}
                    variant="outline"
                    className="w-full"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Open Account Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
