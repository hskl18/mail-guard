"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import {
  Mail,
  Shield,
  Bell,
  ArrowRight,
  Check,
  Info,
  CreditCard,
  HelpCircle,
  Star,
  Building,
  Home,
  School,
  Briefcase,
  Package,
  Camera,
  Users,
  BellRing,
  CheckCircle,
  BookOpen,
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
                    🏠 Smart Mailbox Technology
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Smart Cluster Mailbox
                  </h1>
                  <p className="mx-auto lg:mx-0 max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                    Advanced cluster mailboxes with integrated smart features
                    that identify mail types, send instant notifications upon
                    delivery, monitor fullness levels, and provide individual
                    serial numbers for each compartment.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-base px-8 py-3"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/delivery-hub">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto text-base px-8 py-3"
                    >
                      Explore Features
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-2xl opacity-20 scale-105"></div>
                  <img
                    alt="Smart Cluster Mailbox"
                    className="relative w-full max-w-lg rounded-2xl shadow-2xl object-cover border border-gray-200"
                    src="mailbox.png"
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
                Core Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Advanced Monitoring Capabilities
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                State-of-the-art technology built into every cluster mailbox
                compartment
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
                      Mail Type Detection
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Smart sensors automatically identify different types of
                      mail and packages, providing detailed delivery information
                      and categorization.
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
                      Fullness Monitoring
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Real-time tracking of compartment capacity with
                      intelligent notifications when approaching maximum
                      capacity.
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
                      Serial Number Access
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Each compartment features a unique serial number for
                      seamless website integration and comprehensive status
                      monitoring.
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
                Platform Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Complete Mail Management
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Everything you need for secure, efficient mail management and
                monitoring
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
                      Secure Package Drop
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Track every access to your delivery hub with comprehensive
                      timestamped records of all door events and activities.
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
                      Photo Evidence
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Automatic image capture during mail area access events for
                      complete visual verification and security documentation.
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
                      Real-time Notifications
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Instant alerts delivered via email, SMS, or mobile app
                      whenever mail arrives or is accessed from your
                      compartment.
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
                🏢 Premium Properties
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Perfect for Premium Properties
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Designed specifically for luxury developments and sophisticated
                communities
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
                      Luxury Apartments
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      High-end residential complexes with premium amenities
                      requiring sophisticated mail management solutions.
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
                      Gated communities and homeowner associations seeking
                      enhanced security and convenience for all residents.
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
                      Modern developments incorporating cutting-edge smart
                      infrastructure from the ground up.
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
                ✨ Ready to Use
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-6">
                Integrated Smart Technology
              </h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-8 max-w-3xl mx-auto">
                Our cluster mailboxes come with all smart features pre-installed
                and ready to use. Mailbox owners receive{" "}
                <span className="font-semibold text-primary">
                  free membership
                </span>{" "}
                to our comprehensive Delivery Hub platform.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Pre-installed sensors</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Cloud connectivity</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Free platform access</span>
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
                ❓ Support
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Find answers to common questions about our smart mailbox
                technology
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  q: "How does the smart technology work?",
                  a: "Our cluster mailboxes come with integrated sensors, cameras, and connectivity built right in. No additional installation or setup required - everything works out of the box.",
                },
                {
                  q: "Do I need to download an app?",
                  a: "While we offer a mobile app for the best experience, you can also receive notifications via email or SMS and access information through our web dashboard.",
                },
                {
                  q: "What's included with my mailbox?",
                  a: "Every smart mailbox includes all sensors, camera system, cloud connectivity, and free access to our Delivery Hub platform with no additional subscription fees.",
                },
                {
                  q: "How reliable is the system?",
                  a: "Our sensors are battery-powered with 6-12 month life and continue working during power outages. The system maintains 99.9% uptime with automatic updates.",
                },
                {
                  q: "Can I integrate with other systems?",
                  a: "Yes, our platform includes API access for integration with property management systems, building automation, and other smart home technologies.",
                },
                {
                  q: "How is my privacy protected?",
                  a: "All data is encrypted end-to-end. Images and information are only accessible to authorized users, and we never share data with third parties.",
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
                Smart cluster mailbox technology with integrated monitoring,
                notifications, and security features for premium properties.
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
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <nav className="space-y-2">
                <Link
                  href="#"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  href="#"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </nav>
            </div>
          </div>
          <div className="border-t pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © 2025 Mail Guard. All rights reserved.
              </p>
              <nav className="flex gap-6">
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
