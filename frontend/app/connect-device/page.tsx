"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ConnectDevicePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const response = await fetch(`${API_BASE}/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          name: formData.name,
          location: formData.location,
          is_active: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register device");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error registering device:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Link
        href="/dashboard"
        className="flex items-center text-sm text-gray-600 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Connect New Device</CardTitle>
          <CardDescription>Register your smart mailbox device</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Mailbox"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="Front Yard"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !formData.name}
            >
              {isSubmitting ? "Connecting..." : "Connect Device"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
