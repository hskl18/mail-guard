import Link from "next/link";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto px-4 lg:px-6 h-16 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <Mail className="h-6 w-6 mr-2" />
          <span className="font-bold">Mail Guard</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
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
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                    Secure Delivery Hub for Shared Spaces
                  </h1>
                  <p className="mx-auto lg:mx-0 max-w-[600px] text-gray-500 md:text-xl">
                    Mail Guard transforms shared mail areas into secure,
                    monitored delivery hubs with real-time tracking,
                    notifications, and photo evidence.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center mt-6 lg:mt-0">
                <img
                  alt="Delivery Hub"
                  className="w-full max-w-lg rounded-xl shadow-xl object-cover object-center"
                  src="mailbox.png"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Designed for Multi-Tenant Environments
                </h2>
                <p className="mx-auto text-gray-500 md:text-xl">
                  Perfect solution for shared mail areas in various settings
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <School className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">College Campuses</h3>
                <p className="text-center text-gray-500">
                  Secure mail delivery for student dorms and university housing
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Building className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Apartment Complexes</h3>
                <p className="text-center text-gray-500">
                  Monitor shared mailboxes in multi-tenant apartment buildings
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Home className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">HOA & Gated Communities</h3>
                <p className="text-center text-gray-500">
                  Secure monitoring for community mail kiosks and package areas
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Briefcase className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Office Buildings</h3>
                <p className="text-center text-gray-500">
                  Complete solution for corporate mailrooms and package
                  management
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  How It Works
                </h2>
                <p className="mx-auto text-gray-500 md:text-xl">
                  Simple setup, powerful protection for shared mail areas
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Install the System</h3>
                <p className="text-center text-gray-500">
                  Easily retrofit our sensors to existing mailboxes or lockers.
                  No major modifications required.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Connect to Network</h3>
                <p className="text-center text-gray-500">
                  Secure connection to your building's WiFi or cellular network
                  through our cloud platform.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold">Manage & Monitor</h3>
                <p className="text-center text-gray-500">
                  Administrators and residents access real-time delivery
                  information through web dashboard or mobile app.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Key Features
                </h2>
                <p className="mx-auto text-gray-500 md:text-xl">
                  Everything you need for secure, efficient mail management
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Package className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Secure Package Drop</h3>
                <p className="text-center text-gray-500">
                  Track every access to your delivery hub with timestamped
                  records of all door events.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Camera className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Photo Evidence</h3>
                <p className="text-center text-gray-500">
                  Capture images each time the mail area is accessed for visual
                  verification of deliveries.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Bell className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Real-time Notifications</h3>
                <p className="text-center text-gray-500">
                  Residents receive instant alerts when their mail arrives via
                  email, SMS, or mobile app.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="connection" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Connecting the Ecosystem
                </h2>
                <p className="mx-auto text-gray-500 md:text-xl">
                  Mail Guard brings together all delivery stakeholders in one
                  platform
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <div className="flex flex-col space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <Building className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Property Management
                    </h3>
                    <p className="text-gray-500">
                      Streamlined mail processing for building staff with
                      reduced management overhead and increased security.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Residents</h3>
                    <p className="text-gray-500">
                      Convenient notifications and peace of mind knowing
                      deliveries are secure and monitored.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Couriers & Delivery Services
                    </h3>
                    <p className="text-gray-500">
                      Simplified delivery process with proof of delivery and
                      reduced failed delivery attempts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Security Staff</h3>
                    <p className="text-gray-500">
                      Enhanced security oversight with timestamped access
                      records and visual verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  What Our Customers Say
                </h2>
                <p className="mx-auto text-gray-500 md:text-xl">
                  Join organizations that trust Mail Guard Delivery Hub
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                </div>
                <p className="text-gray-500">
                  "Mail Guard transformed our campus mail center. Students love
                  the notifications, and our staff spends less time managing
                  packages."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                  <div>
                    <p className="font-medium">Robert Chen</p>
                    <p className="text-sm text-gray-500">
                      Campus Housing Director
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                </div>
                <p className="text-gray-500">
                  "The retrofit installation was seamless. Our 200-unit complex
                  now has a modern package solution without any construction
                  disruption."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                  <div>
                    <p className="font-medium">Lisa Rodriguez</p>
                    <p className="text-sm text-gray-500">Property Manager</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                </div>
                <p className="text-gray-500">
                  "Our HOA mail kiosk security issues disappeared overnight. The
                  photo evidence feature has been invaluable for resolving
                  delivery disputes."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                  <div>
                    <p className="font-medium">Marcus Johnson</p>
                    <p className="text-sm text-gray-500">HOA President</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Simple, Transparent Pricing
                </h2>
                <p className="mx-auto text-gray-500 md:text-xl">
                  Flexible plans for different property sizes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col rounded-lg border p-6 shadow-sm bg-white">
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Small Property</h3>
                  <p className="text-gray-500 mt-1">Up to 50 units</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold">$199</span>
                    <span className="ml-1 text-gray-500">/month</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>All core features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Up to 5 monitored mail areas</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Email & SMS notifications</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Basic analytics</span>
                  </li>
                </ul>
                <Link href="/sign-up" className="mt-auto">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
              <div className="flex flex-col rounded-lg border-2 border-primary p-6 shadow-lg bg-white relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Medium Property</h3>
                  <p className="text-gray-500 mt-1">50-200 units</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold">$399</span>
                    <span className="ml-1 text-gray-500">/month</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>All Small Property features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Up to 15 monitored mail areas</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Mobile app for residents</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Advanced analytics & reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Admin dashboard</span>
                  </li>
                </ul>
                <Link href="/sign-up" className="mt-auto">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
              <div className="flex flex-col rounded-lg border p-6 shadow-sm bg-white">
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Large Property</h3>
                  <p className="text-gray-500 mt-1">200+ units</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold">$799</span>
                    <span className="ml-1 text-gray-500">/month</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>All Medium Property features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Unlimited monitored mail areas</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>API integration</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Custom branding</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
                <Link href="/sign-up" className="mt-auto">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Frequently Asked Questions
                </h2>
                <p className="mx-auto text-gray-500 md:text-xl">
                  Find answers to common questions about Mail Guard Delivery Hub
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">
                  How does the retrofit installation work?
                </h3>
                <p className="text-gray-500">
                  Our system is designed to work with existing mailboxes and
                  delivery lockers. The non-invasive installation process uses
                  adhesive mounts and wireless sensors that don't require
                  drilling or permanent modifications.
                </p>
              </div>
              <div className="rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">
                  Do residents need to download an app?
                </h3>
                <p className="text-gray-500">
                  While we offer a mobile app for the best experience, residents
                  can also receive notifications via email or SMS and access
                  their delivery information through a web dashboard.
                </p>
              </div>
              <div className="rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">
                  Is there a hardware purchase required?
                </h3>
                <p className="text-gray-500">
                  The hardware is included in your monthly subscription. We
                  handle all maintenance and updates to ensure your system stays
                  current with the latest technology.
                </p>
              </div>
              <div className="rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">
                  How does the system handle power outages?
                </h3>
                <p className="text-gray-500">
                  Our sensors are battery-powered with a typical 6-12 month
                  life. The system will continue to function during power
                  outages as long as there's an internet connection available.
                </p>
              </div>
              <div className="rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">
                  Can the system integrate with our property management
                  software?
                </h3>
                <p className="text-gray-500">
                  Yes, our Medium and Large plans include API access for
                  integration with popular property management systems, allowing
                  for seamless resident data synchronization.
                </p>
              </div>
              <div className="rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">
                  How is resident data privacy protected?
                </h3>
                <p className="text-gray-500">
                  We take privacy seriously. All data is encrypted, and we never
                  share information with third parties. Images are only
                  accessible to authorized property staff and the specific
                  resident.
                </p>
              </div>
            </div>
            <div className="flex justify-center mt-12">
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Still have questions? Contact us
                </Button>
              </Link>
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
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100"
              >
                Schedule a Demo
              </Button>
            </Link>
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
