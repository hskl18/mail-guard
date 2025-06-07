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
    serial_number: "",
    name: "",
    location: "",
  });
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [validationMessage, setValidationMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Reset validation when serial number changes
    if (e.target.name === "serial_number") {
      setValidationStatus("idle");
      setValidationMessage("");
    }
  };

  const validateSerialNumber = async () => {
    if (!formData.serial_number) return;

    setValidationStatus("validating");
    setValidationMessage("Checking device serial number...");

    try {
      const response = await fetch(
        `/api/iot/activate?serial_number=${formData.serial_number}`
      );
      const data = await response.json();

      if (response.ok && data.is_valid) {
        setValidationStatus("valid");
        setValidationMessage(`✅ Valid device: ${data.device_model}`);
        // Auto-fill name with serial number if empty
        if (!formData.name) {
          setFormData((prev) => ({ ...prev, name: formData.serial_number }));
        }
      } else {
        setValidationStatus("invalid");
        setValidationMessage(
          "❌ Invalid serial number. Please check and try again."
        );
      }
    } catch (error) {
      setValidationStatus("invalid");
      setValidationMessage("❌ Error validating device. Please try again.");
      console.error("Validation error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !user) {
      return;
    }

    // Validate serial number first if not already done
    if (validationStatus !== "valid") {
      await validateSerialNumber();
      return;
    }

    setIsSubmitting(true);

    try {
      // Create device in dashboard with the validated serial number
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          name: formData.name,
          location: formData.location,
          serial_number: formData.serial_number, // Include serial number
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
      setValidationMessage("❌ Failed to connect device. Please try again.");
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
          <CardTitle>Connect IoT Device</CardTitle>
          <CardDescription>
            Connect your mailbox monitoring device to the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Device Serial Number</Label>
              <div className="flex gap-2">
                <Input
                  id="serial_number"
                  name="serial_number"
                  placeholder="SN001234567"
                  value={formData.serial_number}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateSerialNumber}
                  disabled={
                    !formData.serial_number || validationStatus === "validating"
                  }
                >
                  {validationStatus === "validating"
                    ? "Checking..."
                    : "Validate"}
                </Button>
              </div>
              {validationMessage && (
                <p
                  className={`text-sm ${
                    validationStatus === "valid"
                      ? "text-green-600"
                      : validationStatus === "invalid"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {validationMessage}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Main Mailbox Monitor"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Front Door Mailbox"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                !formData.serial_number ||
                !formData.name ||
                validationStatus === "invalid"
              }
            >
              {isSubmitting
                ? "Connecting..."
                : validationStatus === "valid"
                ? "Connect Device"
                : "Validate & Connect"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
