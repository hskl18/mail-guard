"use client"

import { useState } from "react"
import { Bell, Filter, Mail, MailOpen, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Notifications() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")

  // Mock data - in a real app, this would come from an API
  const notifications = [
    {
      id: 1,
      type: "mail_delivered",
      time: "Today, 10:23 AM",
      date: "Apr 23, 2025",
      message: "Mail delivered to your mailbox",
      read: false,
      hasImage: true,
      imageUrl: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 2,
      type: "mailbox_opened",
      time: "Today, 8:15 AM",
      date: "Apr 23, 2025",
      message: "Your mailbox was opened",
      read: true,
      hasImage: true,
      imageUrl: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 3,
      type: "mail_removed",
      time: "Today, 8:16 AM",
      date: "Apr 23, 2025",
      message: "Mail was removed from your mailbox",
      read: true,
      hasImage: false,
    },
    {
      id: 4,
      type: "battery_low",
      time: "Yesterday, 4:30 PM",
      date: "Apr 22, 2025",
      message: "Battery level is below 20%. Please recharge soon.",
      read: true,
      hasImage: false,
    },
    {
      id: 5,
      type: "mail_delivered",
      time: "Yesterday, 2:45 PM",
      date: "Apr 22, 2025",
      message: "Mail delivered to your mailbox",
      read: true,
      hasImage: true,
      imageUrl: "/placeholder.svg?height=400&width=600",
    },
  ]

  const filteredNotifications = filter === "all" ? notifications : notifications.filter((n) => n.type === filter)

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl)
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
                  <SelectItem value="mailbox_opened">Mailbox opened</SelectItem>
                  <SelectItem value="mail_removed">Mail removed</SelectItem>
                  <SelectItem value="battery_low">Battery alerts</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-sm text-gray-500 mt-1">There are no notifications matching your current filter.</p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${getNotificationIconBackground(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">{notification.time}</p>
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
                            onClick={() => openImageDialog(notification.imageUrl!)}
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            )}
          </div>
        </CardContent>
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
      </Card>

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Captured Image</DialogTitle>
            <DialogDescription>Image captured when your mailbox was accessed</DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-video overflow-hidden rounded-md">
              <img src={selectedImage || "/placeholder.svg"} alt="Mailbox capture" className="object-cover w-full" />
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
  )
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "mail_delivered":
      return <Mail className="h-4 w-4 text-white" />
    case "mailbox_opened":
      return <MailOpen className="h-4 w-4 text-white" />
    case "mail_removed":
      return <Mail className="h-4 w-4 text-white" />
    case "battery_low":
      return <Bell className="h-4 w-4 text-white" />
    default:
      return <Bell className="h-4 w-4 text-white" />
  }
}

function getNotificationIconBackground(type: string) {
  switch (type) {
    case "mail_delivered":
      return "bg-green-500"
    case "mailbox_opened":
      return "bg-blue-500"
    case "mail_removed":
      return "bg-amber-500"
    case "battery_low":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}
