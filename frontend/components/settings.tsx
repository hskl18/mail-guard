"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Bell,
  Smartphone,
  Wifi,
  Shield,
  Save,
  Mail,
  AlertTriangle,
  UserIcon,
  Settings as SettingsIcon,
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
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
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
    push_notifications: true,
    email_notifications: false,
  });

  // Device settings with defaults that will be overridden by API data
  const [deviceSettings, setDeviceSettings] = useState({
    name: "",
    location: "",
    check_interval: "15",
    capture_image_on_open: true,
    capture_image_on_delivery: true,
  });

  // Load devices and settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError("");

      try {
        // Use the consolidated dashboard endpoint to get all devices in one call
        const dashboardUrl = `${API_BASE}/dashboard/${user.id}`;
        console.log(`Fetching dashboard data from: ${dashboardUrl}`);

        const dashboardRes = await fetch(dashboardUrl, {
          method: "GET",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
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
              mail_delivered_notify: device.mail_delivered_notify ?? true,
              mailbox_opened_notify: device.mailbox_opened_notify ?? true,
              mail_removed_notify: device.mail_removed_notify ?? true,
              push_notifications: device.push_notifications ?? true,
              email_notifications: device.email_notifications ?? false,
            });

            setDeviceSettings((prev) => ({
              ...prev,
              check_interval: String(device.check_interval ?? 15),
              capture_image_on_open: device.capture_image_on_open ?? true,
              capture_image_on_delivery:
                device.capture_image_on_delivery ?? true,
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

    loadSettings();
  }, [user, API_BASE]);

  // Function to load device settings (only used if not already available in dashboard data)
  const loadDeviceSettings = async (deviceId: number, clerkId: string) => {
    try {
      const settingsUrl = `${API_BASE}/devices/${deviceId}/settings?clerk_id=${clerkId}`;
      console.log(`Fetching device settings from: ${settingsUrl}`);

      const settingsRes = await fetch(settingsUrl, {
        method: "GET",
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
      });

      if (!settingsRes.ok) {
        throw new Error(`Failed to fetch settings: ${settingsRes.status}`);
      }

      const settingsData = await settingsRes.json();
      console.log("Settings data:", settingsData);

      // Update notification settings
      setNotificationSettings({
        mail_delivered_notify: settingsData.mail_delivered_notify ?? true,
        mailbox_opened_notify: settingsData.mailbox_opened_notify ?? true,
        mail_removed_notify: settingsData.mail_removed_notify ?? true,
        push_notifications: settingsData.push_notifications ?? true,
        email_notifications: settingsData.email_notifications ?? false,
      });

      // Update device settings
      setDeviceSettings((prev) => ({
        ...prev,
        check_interval: String(settingsData.check_interval ?? 15),
        capture_image_on_open: settingsData.capture_image_on_open ?? true,
        capture_image_on_delivery:
          settingsData.capture_image_on_delivery ?? true,
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
        push_notifications: notificationSettings.push_notifications,
        email_notifications: notificationSettings.email_notifications,
        check_interval: parseInt(deviceSettings.check_interval, 10),
        capture_image_on_open: deviceSettings.capture_image_on_open,
        capture_image_on_delivery: deviceSettings.capture_image_on_delivery,
      };

      // Update device settings
      const settingsUrl = `${API_BASE}/devices/${currentDevice.id}/settings`;
      const settingsRes = await fetch(settingsUrl, {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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
          email: currentDevice.email,
          name: deviceSettings.name,
          location: deviceSettings.location,
          is_active: currentDevice.is_active,
        };

        const deviceUrl = `${API_BASE}/devices/${currentDevice.id}`;
        const deviceRes = await fetch(deviceUrl, {
          method: "PUT",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(devicePayload),
        });

        if (!deviceRes.ok) {
          throw new Error(`Failed to update device: ${deviceRes.status}`);
        }
      }

      toast.success("Settings saved successfully");
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
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

  // If no devices, show a message
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-gray-600">No devices connected yet.</p>
        <Button onClick={() => (window.location.href = "/connect-device")}>
          Connect Device
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="notifications" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="device">Device</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Event Notifications</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-500" />
                  <Label htmlFor="mail-delivered">Mail delivered</Label>
                </div>
                <Switch
                  id="mail-delivered"
                  checked={notificationSettings.mail_delivered_notify}
                  onCheckedChange={() =>
                    handleNotificationChange("mail_delivered_notify")
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="mailbox-opened">Mailbox opened</Label>
                </div>
                <Switch
                  id="mailbox-opened"
                  checked={notificationSettings.mailbox_opened_notify}
                  onCheckedChange={() =>
                    handleNotificationChange("mailbox_opened_notify")
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="mail-removed">Mail removed</Label>
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

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Methods</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label htmlFor="push-notifications">Push notifications</Label>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notificationSettings.push_notifications}
                  onCheckedChange={() =>
                    handleNotificationChange("push_notifications")
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <Label htmlFor="email-notifications">
                    Email notifications
                  </Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={() =>
                    handleNotificationChange("email_notifications")
                  }
                />
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

      <TabsContent value="device">
        <Card>
          <CardHeader>
            <CardTitle>Device Settings</CardTitle>
            <CardDescription>
              Configure your Smart Mailbox Monitor device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={deviceSettings.name}
                  onChange={(e) =>
                    handleDeviceSettingChange("name", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={deviceSettings.location}
                  onChange={(e) =>
                    handleDeviceSettingChange("location", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="check-interval">Check Interval (minutes)</Label>
                <Select
                  value={deviceSettings.check_interval}
                  onValueChange={(value) =>
                    handleDeviceSettingChange("check_interval", value)
                  }
                >
                  <SelectTrigger id="check-interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  How often the device checks for mail.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Camera Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="capture-on-open">
                    Capture image when mailbox is opened
                  </Label>
                  <p className="text-xs text-gray-500">
                    Takes a photo whenever the mailbox is opened
                  </p>
                </div>
                <Switch
                  id="capture-on-open"
                  checked={deviceSettings.capture_image_on_open}
                  onCheckedChange={(checked) =>
                    handleDeviceSettingChange("capture_image_on_open", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="capture-on-delivery">
                    Capture image on mail delivery
                  </Label>
                  <p className="text-xs text-gray-500">
                    Takes a photo when new mail is detected
                  </p>
                </div>
                <Switch
                  id="capture-on-delivery"
                  checked={deviceSettings.capture_image_on_delivery}
                  onCheckedChange={(checked) =>
                    handleDeviceSettingChange(
                      "capture_image_on_delivery",
                      checked
                    )
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connectivity</h3>
              <div className="grid gap-2">
                <Label htmlFor="wifi-network">WiFi Network</Label>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span>Connected to "Home Network"</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto"
                >
                  Change WiFi Network
                </Button>
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
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your Mail Guard account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {user?.fullName || user?.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user?.primaryEmailAddress?.emailAddress}
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

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connected Accounts</h3>
              <p className="text-sm text-gray-500">
                Manage your account details, profile information, and security
                settings through Clerk's secure user management portal.
              </p>
              <div className="space-y-2">
                <p className="text-sm">With Clerk, you can:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Update your personal information</li>
                  <li>Change your password or set up passwordless login</li>
                  <li>Enable two-factor authentication</li>
                  <li>Manage connected social accounts</li>
                  <li>View login history and active sessions</li>
                </ul>
              </div>
              <Button
                onClick={() => openUserProfile()}
                variant="outline"
                className="w-full mt-4"
              >
                Open Account Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
