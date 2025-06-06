"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/dashboard";
import Notifications from "@/components/notifications";
import Settings from "@/components/settings";
import { Loader2, Mail, Shield, BarChart3, BookOpen } from "lucide-react";
import UserNav from "@/components/user-nav";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  Mail Guard
                </h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  Mail Guard
                </h1>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="mb-6 sm:mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <TabsTrigger
                value="dashboard"
                className="flex items-center space-x-2 text-sm sm:text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center space-x-2 text-sm sm:text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center space-x-2 text-sm sm:text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Shield className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[600px]">
            <TabsContent value="dashboard" className="m-0 p-4 sm:p-6">
              <Suspense fallback={<LoadingState />}>
                <Dashboard />
              </Suspense>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 p-4 sm:p-6">
              <Suspense fallback={<LoadingState />}>
                <Notifications />
              </Suspense>
            </TabsContent>

            <TabsContent value="settings" className="m-0 p-4 sm:p-6">
              <Suspense fallback={<LoadingState />}>
                <Settings />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-500">Loading dashboard...</p>
    </div>
  );
}
