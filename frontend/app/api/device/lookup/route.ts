import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET /api/device/lookup - Lookup device by serial ID
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialId = searchParams.get("serial_id");

  if (!serialId) {
    return NextResponse.json(
      { error: "serial_id parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Search for the device with this serial ID in the devices table
    // Assuming serial_id is stored in the 'name' field for now
    const devices = await executeQuery<any[]>(
      "SELECT id, clerk_id FROM devices WHERE name LIKE ?",
      [`%${serialId}%`]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Return the first matching device
    return NextResponse.json({
      device_id: devices[0].id,
      clerk_id: devices[0].clerk_id,
    });
  } catch (error) {
    console.error("Error looking up device by serial ID:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
