import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Device } from "@/lib/types";

// GET /api/device/lookup-serial - Lookup device by serial number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serial_number");

    if (!serialNumber) {
      return NextResponse.json(
        { error: "serial_number parameter is required" },
        { status: 400 }
      );
    }

    const devices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE serial_number = ?",
      [serialNumber]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found with this serial number" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      device: devices[0],
      found: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error looking up device by serial:", error);
    return NextResponse.json(
      { error: "Failed to lookup device" },
      { status: 500 }
    );
  }
}
