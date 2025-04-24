import { Battery, Mail, MailOpen, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function Dashboard() {
  // Mock data - in a real app, this would come from an API
  const mailboxStatus = {
    isOpen: false,
    hasNewMail: true,
    batteryLevel: 78,
    lastChecked: "2 hours ago",
    recentEvents: [
      { id: 1, type: "mail_delivered", time: "Today, 10:23 AM", message: "Mail delivered" },
      { id: 2, type: "mailbox_opened", time: "Today, 8:15 AM", message: "Mailbox opened" },
      { id: 3, type: "mail_removed", time: "Today, 8:16 AM", message: "Mail removed" },
      { id: 4, type: "mailbox_closed", time: "Today, 8:17 AM", message: "Mailbox closed" },
      { id: 5, type: "mail_delivered", time: "Yesterday, 2:45 PM", message: "Mail delivered" },
    ],
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Status Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Real-time information about your mailbox</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {mailboxStatus.isOpen ? (
                  <MailOpen className="h-5 w-5 text-amber-500" />
                ) : (
                  <Mail className="h-5 w-5 text-green-500" />
                )}
                <span className="font-medium">Mailbox is {mailboxStatus.isOpen ? "open" : "closed"}</span>
                {mailboxStatus.isOpen && (
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                    Alert
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                {mailboxStatus.hasNewMail ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                    Mail Present
                  </Badge>
                ) : (
                  <Badge variant="outline">No Mail</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Last checked: {mailboxStatus.lastChecked}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Battery</span>
                </div>
                <span className="text-sm font-medium">{mailboxStatus.batteryLevel}%</span>
              </div>
              <Progress value={mailboxStatus.batteryLevel} className="h-2" />
              {mailboxStatus.batteryLevel < 20 && (
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-500">Low battery, please recharge soon</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" size="sm">
              Refresh Status
            </Button>
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
            Check for new mail
          </Button>
          <Button className="justify-start" variant="outline">
            <Battery className="mr-2 h-4 w-4" />
            Check battery status
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
            {mailboxStatus.recentEvents.map((event, index) => (
              <div key={event.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {event.type === "mail_delivered" && <Mail className="h-4 w-4 text-green-500" />}
                    {event.type === "mailbox_opened" && <MailOpen className="h-4 w-4 text-blue-500" />}
                    {event.type === "mail_removed" && <Mail className="h-4 w-4 text-amber-500" />}
                    {event.type === "mailbox_closed" && <Mail className="h-4 w-4 text-gray-500" />}
                    <div>
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </div>
                  </div>
                  {(event.type === "mailbox_opened" || event.type === "mail_delivered") && (
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Image
                    </Button>
                  )}
                </div>
                {index < mailboxStatus.recentEvents.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
