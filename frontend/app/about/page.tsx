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
} from "lucide-react";

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
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                  About Mail Guard
                </h1>
                <p className="mx-auto text-gray-500 md:text-xl max-w-[700px]">
                  A comprehensive IoT solution for monitoring mailboxes and
                  shared delivery hubs.
                </p>
              </div>
            </div>

            <div className="grid gap-12 lg:gap-16 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Overview</h2>
                <p className="text-gray-500">
                  Mail Guard is designed to add security to shared mail areas
                  and prevent mail theft. The system consists of:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-500 pl-4">
                  <li>
                    Hardware device (ESP32-based) that attaches inside standard
                    mailboxes or delivery lockers
                  </li>
                  <li>Cloud backend API (FastAPI on AWS Lambda)</li>
                  <li>User-friendly web dashboard (Next.js)</li>
                </ul>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <BellRing className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Real-time Monitoring</h3>
                      <p className="text-gray-500">
                        Detect when mail is delivered or when the mailbox is
                        accessed
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
                        Capture images when the mail area is accessed for visual
                        verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Security Features</h3>
                      <p className="text-gray-500">
                        Enhance security with timestamped access records and
                        visual evidence
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <Battery className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Battery Monitoring</h3>
                      <p className="text-gray-500">
                        Track battery status with low-battery alerts to ensure
                        continuous operation
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Technology Stack</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">Frontend</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-500 pl-4">
                      <li>Next.js 15 (App Router) with React 19</li>
                      <li>TypeScript for type safety</li>
                      <li>Tailwind CSS & shadcn/ui for styling</li>
                      <li>Clerk for authentication</li>
                      <li>Recharts for data visualization</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">Backend</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-500 pl-4">
                      <li>Python 3.11 with FastAPI & Pydantic</li>
                      <li>MySQL database with SSL support</li>
                      <li>AWS Lambda & API Gateway</li>
                      <li>S3 for image storage</li>
                      <li>MailerSend for notifications</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">System Architecture</h2>
                <div className="p-6 bg-gray-50 rounded-lg border">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
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
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Target Environments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-bold mb-2">College Campuses</h3>
                    <p className="text-gray-500">
                      Secure mail delivery for student dorms and university
                      housing
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-bold mb-2">Apartment Complexes</h3>
                    <p className="text-gray-500">
                      Monitor shared mailboxes in multi-tenant apartment
                      buildings
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-bold mb-2">HOA & Gated Communities</h3>
                    <p className="text-gray-500">
                      Secure monitoring for community mail kiosks and package
                      areas
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-bold mb-2">Office Buildings</h3>
                    <p className="text-gray-500">
                      Complete solution for corporate mailrooms and package
                      management
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
              Ready to upgrade your property's delivery system?
            </h2>
            <p className="mx-auto max-w-[600px] mb-6">
              Join leading properties, campuses, and offices that trust Mail
              Guard for secure package management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  Schedule a Demo
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-primary-dark"
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
