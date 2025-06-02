import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Shield,
  ArrowLeft,
  Camera,
  Battery,
  BellRing,
  Wifi,
  Settings,
  Server,
  School,
  Package,
  Clock,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  ThermometerSnowflake,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Mail className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold">Mail Guard</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/"
          >
            Home
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4 text-primary"
            href="/about"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/market"
          >
            Market
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/sign-in"
          >
            Sign In
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/sign-up"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <Badge variant="outline" className="px-3 py-1">
                University Focus
              </Badge>
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                  Smart Delivery Hub for California Campuses
                </h1>
                <p className="mx-auto text-gray-500 md:text-xl max-w-[700px]">
                  Secure and streamline package and meal deliveries on campus
                  with our innovative, low-cost IoT solution.
                </p>
              </div>
            </div>

            <div className="grid gap-12 lg:gap-16 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Executive Summary</h2>
                <p className="text-gray-500">
                  MailGuard is launching a Smart Delivery Hub tailored for
                  university environments in California. Our goal is to secure
                  and streamline package and meal deliveries on campus, solving
                  widespread issues of theft and inefficient pickup. The initial
                  prototype is a compact module—a small, battery‑powered box
                  equipped with a magnetic reed switch (door sensor) and an
                  OV2640 camera. When mounted inside a locker or mailbox
                  compartment, it instantly detects access events, captures a
                  photo, and sends data over HTTPS to our cloud backend.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold">The Problem</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        Package Theft
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Students living on campus face frequent package and food
                        theft. Dorm hallways and mailrooms often see unattended
                        parcels stolen or misplaced.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg">
                        <Clock className="h-5 w-5 mr-2 text-orange-500" />
                        Inefficient Pickup
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Traditional mailrooms require staff intervention and
                        have limited hours. Students queue in long lines to
                        retrieve parcels, causing delays and frustration.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg">
                        <DollarSign className="h-5 w-5 mr-2 text-yellow-500" />
                        Expensive Solutions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Large locker systems (Amazon Hub, Luxer One) are
                        expensive ($10k–$20k per bank), require significant
                        installation, and often cater only to packages, not
                        food.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Our Solution</h2>
                <p className="text-gray-500 mb-6">
                  MailGuard delivers a scalable, affordable Smart Delivery Hub
                  that secures packages and meals in private compartments,
                  provides real-time alerts with image logs, and offers a
                  low-cost, modular design so facilities can deploy one small
                  unit per locker rather than purchasing expensive locker banks.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <BellRing className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Real-time Monitoring</h3>
                      <p className="text-gray-500">
                        Magnetic reed switch detects when a locker door is
                        opened or closed, instantly sending notifications.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Photo Evidence</h3>
                      <p className="text-gray-500">
                        OV2640 camera snaps an image at each access event,
                        creating a visual log and deterring theft.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <Battery className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Power Efficient</h3>
                      <p className="text-gray-500">
                        Deep sleep between events extends battery life to ~3
                        weeks on a single charge with 10 accesses per day.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Easy Installation</h3>
                      <p className="text-gray-500">
                        Battery-powered prototype mounts inside any locker with
                        double-sided tape—no wiring or complex installation
                        required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Prototype Description</h2>
                <div className="rounded-lg border p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4">
                        Hardware Components
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-500 pl-4">
                        <li>
                          Enclosure: 3D-printed ABS/PLA plastic box (~3×3×2
                          inches)
                        </li>
                        <li>ESP32-CAM board as microcontroller and camera</li>
                        <li>Magnetic reed switch for door detection</li>
                        <li>
                          Lithium-ion battery with onboard charger (TP4056)
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-4">
                        Performance Metrics
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-500 pl-4">
                        <li>
                          Reliable door open/close detection (no false triggers)
                        </li>
                        <li>Camera captures 640×480 JPEG in under 300ms</li>
                        <li>Battery life: ~3 weeks with 10 accesses per day</li>
                        <li>Deep sleep current draw: ~5mA</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">System Architecture</h2>
                <div className="p-6 bg-gray-50 rounded-lg border">
                  <h3 className="text-lg font-bold mb-4">
                    End-to-End System Flow:
                  </h3>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {`[ESP32 Module]
                      ├─ Reed switch (door)
                      ├─ Camera (OV2640)
                      │
                      ↓ HTTPS
                      │
                      [API Gateway] → [Lambda (FastAPI)]
                                    ├─ MySQL (events & devices)
                                    ├─ S3 (images)
                                    └─ MailerSend (notifications)
                                    │
                                    ↓
                      [Next.js Web Dashboard] ← Clerk Auth`}
                  </pre>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold mb-2">Device Layer:</h4>
                      <p className="text-gray-500">
                        ESP32-CAM with deep-sleep cycles for low power
                        consumption
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Backend Layer:</h4>
                      <p className="text-gray-500">
                        AWS Lambda with FastAPI, RDS MySQL, S3 for images
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Implementation Plan</h2>
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Phase
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Timeline
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Key Milestones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            Prototype Build & Validation
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Weeks 1-4
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <ul className="list-disc list-inside">
                              <li>Finalize hardware assembly</li>
                              <li>Develop & test firmware</li>
                              <li>Deploy cloud backend</li>
                              <li>Conduct bench tests</li>
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            Campus Pilot Deployment
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Weeks 5-8
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <ul className="list-disc list-inside">
                              <li>Install 5 prototype modules</li>
                              <li>Collect student feedback</li>
                              <li>Monitor reliability & performance</li>
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            Iterate & Expand
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Weeks 9-12
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <ul className="list-disc list-inside">
                              <li>Hardware & firmware improvements</li>
                              <li>Multi-module hub management</li>
                              <li>Campus authentication integration</li>
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            Full-Scale Rollout
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Months 4-6
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <ul className="list-disc list-inside">
                              <li>Finalize durable enclosure design</li>
                              <li>20-unit campus deployment</li>
                              <li>Enhanced dashboard features</li>
                              <li>Campus-wide awareness campaign</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Future Extensions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center mb-2">
                      <ThermometerSnowflake className="h-5 w-5 mr-2 text-blue-500" />
                      <h3 className="font-bold">Temperature Control</h3>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Food lockers with passive insulation or active cooling for
                      meal deliveries
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center mb-2">
                      <Package className="h-5 w-5 mr-2 text-green-500" />
                      <h3 className="font-bold">Weight Sensing</h3>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Load cells to differentiate between "package delivered"
                      and "empty door open"
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center mb-2">
                      <School className="h-5 w-5 mr-2 text-purple-500" />
                      <h3 className="font-bold">Campus ID Integration</h3>
                    </div>
                    <p className="text-gray-500 text-sm">
                      SSO/LDAP integration for auto-registration and mobile
                      credential unlocking
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20 bg-primary text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tighter md:text-3xl mb-4">
              Ready to transform your campus delivery system?
            </h2>
            <p className="mx-auto max-w-[600px] mb-6">
              Contact us to learn more about our California campus pilot program
              or schedule a demo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  Join Pilot Program
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © 2025 Mail Guard Delivery Hub. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6">
              <Link
                className="text-xs hover:underline underline-offset-4"
                href="#"
              >
                Terms of Service
              </Link>
              <Link
                className="text-xs hover:underline underline-offset-4"
                href="#"
              >
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
