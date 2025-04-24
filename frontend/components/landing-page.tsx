import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Bell, ArrowRight } from "lucide-react";

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
                    Never Miss a Mail Delivery Again
                  </h1>
                  <p className="mx-auto lg:mx-0 max-w-[600px] text-gray-500 md:text-xl">
                    Smart Mailbox Monitor keeps you updated in real-time when
                    mail arrives, is collected, or when your mailbox is
                    accessed.
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
                  alt="Mailbox"
                  className="w-full max-w-lg rounded-xl shadow-xl object-cover object-center"
                  src="mailbox.png"
                />
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
                  Everything you need to keep your mail secure and monitored
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Mail className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Real-time Notifications</h3>
                <p className="text-center text-gray-500">
                  Get instant alerts when mail is delivered or when your mailbox
                  is accessed.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Shield className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Security Monitoring</h3>
                <p className="text-center text-gray-500">
                  Capture images when your mailbox is opened to ensure your mail
                  is secure.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <Bell className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Customizable Alerts</h3>
                <p className="text-center text-gray-500">
                  Configure exactly when and how you want to be notified about
                  your mailbox.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © 2025 Smart Mailbox Monitor. All rights reserved.
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
