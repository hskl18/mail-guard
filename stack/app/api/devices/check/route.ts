import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Device } from "@/lib/types";

// GET /api/devices/check - Check if user has a device
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerk_id");

    if (!clerkId) {
      return NextResponse.json(
        { error: "clerk_id parameter is required" },
        { status: 400 }
      );
    }

    const devices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE clerk_id = ?",
      [clerkId]
    );

    return NextResponse.json({
      has_device: devices.length > 0,
      device_count: devices.length,
      devices: devices,
    });
  } catch (error) {
    console.error("Error checking user devices:", error);
    return NextResponse.json(
      { error: "Failed to check user devices" },
      { status: 500 }
    );
  }
}
