"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/dashboard";
import Notifications from "@/components/notifications";
import Settings from "@/components/settings";
import { Loader2 } from "lucide-react";
import UserNav from "@/components/user-nav";

export default function AuthenticatedApp() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Mail Guard Delivery Hub
            </h1>
            <p className="text-gray-500">
              Secure monitoring for shared mail areas
            </p>
          </div>
          <UserNav />
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Suspense fallback={<LoadingState />}>
              <Dashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="notifications">
            <Suspense fallback={<LoadingState />}>
              <Notifications />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings">
            <Suspense fallback={<LoadingState />}>
              <Settings />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}
