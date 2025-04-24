"use client"

import { useState } from "react"
import { Bell, Smartphone, Wifi, Shield, Save, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Settings() {
  // Mock settings state - in a real app, this would be fetched from an API
  const [notificationSettings, setNotificationSettings] = useState({
    mailDelivered: true,
    mailboxOpened: true,
    mailRemoved: true,
    batteryLow: true,
    pushNotifications: true,
    emailNotifications: false,
  })

  const [deviceSettings, setDeviceSettings] = useState({
    deviceName: "Home Mailbox",
    checkInterval: "15",
    batteryNotificationThreshold: "20",
    captureImageOnOpen: true,
    captureImageOnDelivery: true,
  })

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key],
    })
  }

  const handleDeviceSettingChange = (key: keyof typeof deviceSettings, value: string | boolean) => {
    setDeviceSettings({
      ...deviceSettings,
      [key]: value,
    })
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
            <CardDescription>Configure how and when you receive notifications</CardDescription>
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
                  checked={notificationSettings.mailDelivered}
                  onCheckedChange={() => handleNotificationChange("mailDelivered")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="mailbox-opened">Mailbox opened</Label>
                </div>
                <Switch
                  id="mailbox-opened"
                  checked={notificationSettings.mailboxOpened}
                  onCheckedChange={() => handleNotificationChange("mailboxOpened")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="mail-removed">Mail removed</Label>
                </div>
                <Switch
                  id="mail-removed"
                  checked={notificationSettings.mailRemoved}
                  onCheckedChange={() => handleNotificationChange("mailRemoved")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-500" />
                  <Label htmlFor="battery-low">Battery low</Label>
                </div>
                <Switch
                  id="battery-low"
                  checked={notificationSettings.batteryLow}
                  onCheckedChange={() => handleNotificationChange("batteryLow")}
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
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={() => handleNotificationChange("pushNotifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <Label htmlFor="email-notifications">Email notifications</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationChange("emailNotifications")}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="device">
        <Card>
          <CardHeader>
            <CardTitle>Device Settings</CardTitle>
            <CardDescription>Configure your Smart Mailbox Monitor device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={deviceSettings.deviceName}
                  onChange={(e) => handleDeviceSettingChange("deviceName", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="check-interval">Check Interval (minutes)</Label>
                <Select
                  value={deviceSettings.checkInterval}
                  onValueChange={(value) => handleDeviceSettingChange("checkInterval", value)}
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
                  How often the device checks for mail. Lower values use more battery.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="battery-threshold">Battery Notification Threshold (%)</Label>
                <Select
                  value={deviceSettings.batteryNotificationThreshold}
                  onValueChange={(value) => handleDeviceSettingChange("batteryNotificationThreshold", value)}
                >
                  <SelectTrigger id="battery-threshold">
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Camera Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="capture-on-open">Capture image when mailbox is opened</Label>
                  <p className="text-xs text-gray-500">Takes a photo whenever the mailbox is opened</p>
                </div>
                <Switch
                  id="capture-on-open"
                  checked={deviceSettings.captureImageOnOpen}
                  onCheckedChange={(checked) => handleDeviceSettingChange("captureImageOnOpen", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="capture-on-delivery">Capture image on mail delivery</Label>
                  <p className="text-xs text-gray-500">Takes a photo when new mail is detected</p>
                </div>
                <Switch
                  id="capture-on-delivery"
                  checked={deviceSettings.captureImageOnDelivery}
                  onCheckedChange={(checked) => handleDeviceSettingChange("captureImageOnDelivery", checked)}
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
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                  Change WiFi Network
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="mr-2">
              Reset Device
            </Button>
            <Button className="ml-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" defaultValue="John Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Security</h3>
              <div className="grid gap-2">
                <Button variant="outline" className="w-full md:w-auto">
                  <Shield className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
              <div className="grid gap-2">
                <Button variant="outline" className="w-full md:w-auto">
                  <Shield className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Linked Devices</h3>
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">iPhone 13</p>
                      <p className="text-xs text-gray-500">Last active: Today, 2:45 PM</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
              <p className="text-xs text-gray-500">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
