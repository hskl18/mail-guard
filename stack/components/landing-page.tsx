"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import {
  Mail,
  Bell,
  ArrowRight,
  Star,
  Building,
  Home,
  Package,
  Camera,
  BellRing,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link className="flex items-center" href="/">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                Mail Guard
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
              href="/"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
              href="/delivery-hub"
            >
              Delivery Hub
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
              href="/docs"
            >
              API Docs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>

            {/* Authentication-based navigation */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
              <SignedOut>
                <Link
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  href="/sign-in"
                >
                  Sign In
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium shadow-sm"
                  >
                    Get Started
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </SignedIn>
            </div>
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden">
            <div className="flex items-center space-x-3">
              <SignedIn>
                <Link
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </SignedIn>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-8 w-8 p-0"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                  <nav className="flex flex-col space-y-4">
                    <Link
                      href="/"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href="/delivery-hub"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Delivery Hub
                    </Link>
                    <Link
                      href="/docs"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      API Docs
                    </Link>
                    <div className="border-t border-gray-200 pt-4">
                      <SignedOut>
                        <div className="flex flex-col space-y-3">
                          <Link
                            href="/sign-in"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/sign-up"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm w-fit"
                            >
                              Get Started
                            </Button>
                          </Link>
                        </div>
                      </SignedOut>
                    </div>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Enhanced */}
        <section className="w-full py-16 md:py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
                <div className="space-y-4">
                  <Badge variant="outline" className="w-fit mx-auto lg:mx-0">
                    Software prototype
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Mailbox Event Monitoring
                  </h1>
                  <p className="mx-auto lg:mx-0 max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                    An engineering prototype for receiving mailbox device
                    events, associating image evidence, and reviewing activity
                    through an authenticated dashboard.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-base px-8 py-3"
                    >
                      Open Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/delivery-hub">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto text-base px-8 py-3"
                    >
                      Review Workflow
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-2xl opacity-20 scale-105"></div>
                  <Image
                    alt="Concept mailbox used to illustrate the Mail Guard prototype"
                    className="relative w-full max-w-lg rounded-2xl shadow-2xl object-cover border border-gray-200"
                    src="/mailbox.png"
                    width={960}
                    height={640}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                Implemented Scope
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                A Full-stack Software Workflow
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                The repository connects device-facing APIs, authenticated data
                access, image storage, notifications, and dashboard views.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Device Event Intake
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Device clients can submit structured delivery and access
                      events through authenticated API endpoints.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                      <BellRing className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Sensor Status
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Sensor readings can be stored with event history and
                      presented in the authenticated dashboard.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <Camera className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Device Activation
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Device serial numbers connect incoming events to the
                      correct owner after an explicit activation flow.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section - Enhanced */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                Application Layers
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Evidence from Device to Dashboard
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                The prototype focuses on traceable events, ownership boundaries,
                and operator-visible status.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                      <Package className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Access Event Records
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Store timestamped device events so authenticated owners can
                      review delivery and access history.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                      <Camera className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Image Evidence
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Associate uploaded images with device events and serve them
                      through an ownership-checked proxy.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                      <Bell className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Email Notification Path
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Exercise an event-driven email path through Resend when the
                      required hosted service configuration is available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <Link href="/delivery-hub">
                <Button
                  variant="link"
                  size="lg"
                  className="text-primary font-semibold"
                >
                  View complete feature list →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Target Audience Section - Enhanced */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Evaluation Scenarios
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Designed for Architecture Evaluation
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Use the prototype to examine how a mailbox monitoring system
                could serve several multi-unit environments.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-cyan-100 rounded-xl group-hover:bg-cyan-200 transition-colors">
                      <Building className="h-8 w-8 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Apartment Buildings
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Model compartment ownership, delivery events, and resident
                      access in a shared building.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                      <Home className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      HOA Communities
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Explore role and ownership boundaries for shared community
                      infrastructure.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      New Construction
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Evaluate API, storage, and dashboard integration before
                      selecting or deploying physical devices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Section - Enhanced */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                Prototype Boundaries
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-6">
                Scope and Open Validation Work
              </h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-8 max-w-3xl mx-auto">
                Mail Guard is a software prototype. The repository demonstrates
                the application architecture. A real deployment requires
                validation with mailbox hardware, hosted services, monitoring,
                and incident response.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Web and API prototype</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Hosted services required</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Hardware validation pending</span>
                  </div>
                </div>
              </div>
              <Link href="/delivery-hub">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-3"
                >
                  Explore Delivery Hub Features
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section - Enhanced */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                Technical Notes
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Prototype Questions
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Clear boundaries make the implementation easier to evaluate.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  q: "What is implemented in this repository?",
                  a: "The project includes device-facing APIs, an authenticated dashboard, ownership checks, event and image records, email integration, and an experimental ESP32 firmware path.",
                },
                {
                  q: "Is this a deployable mailbox product?",
                  a: "No. It is an engineering prototype for evaluating the software architecture and device workflow, not a manufactured or production-validated mailbox system.",
                },
                {
                  q: "Which external services are required?",
                  a: "The full workflow depends on configured Clerk, MySQL, S3, and Resend services. The repository documents these dependencies and local setup requirements.",
                },
                {
                  q: "What has not been validated?",
                  a: "Production reliability, device durability, power behavior, sensor accuracy, connectivity, monitoring, incident response, and a complete security review remain open validation work.",
                },
                {
                  q: "Can the API be extended?",
                  a: "The current API demonstrates device events and dashboard data. Any third-party integration would require its own contract, authorization model, tests, and operational validation.",
                },
                {
                  q: "Which security boundaries are demonstrated?",
                  a: "The prototype includes Clerk sessions, device credentials, ownership-scoped reads and writes, verified database TLS, rate limiting, and authorized image access. These controls do not replace a production security review.",
                },
              ].map((faq, index) => (
                <div key={index} className="group">
                  <div className="rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                      {faq.q}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-primary rounded-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl">Mail Guard</span>
              </Link>
              <p className="text-gray-600 leading-relaxed max-w-md">
                An IoT mailbox monitoring prototype focused on explicit
                ownership, event evidence, and full-stack integration.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <nav className="space-y-2">
                <Link
                  href="/delivery-hub"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Delivery Hub
                </Link>
                <Link
                  href="/dashboard"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Project</h4>
              <nav className="space-y-2">
                <Link
                  href="/docs"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  API Docs
                </Link>
                <Link
                  href="https://github.com/hskl18/mail-guard"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Source Code
                </Link>
              </nav>
            </div>
          </div>
          <div className="border-t pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                Mail Guard engineering prototype. See the repository for scope
                and limitations.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
