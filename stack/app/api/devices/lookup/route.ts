import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET /api/devices/lookup?name=devicename&clerk_id=user_id - Get device by name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get("name");
    const clerkId = searchParams.get("clerk_id");

    if (!deviceName || !clerkId) {
      return NextResponse.json(
        { error: "Missing required parameters: name and clerk_id" },
        { status: 400 }
      );
    }

    const devices = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE name = ? AND clerk_id = ?",
      [deviceName, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json(devices[0]);
  } catch (error) {
    console.error("Error fetching device by name:", error);
    return NextResponse.json(
      { error: "Failed to fetch device" },
      { status: 500 }
    );
  }
}

// PUT /api/devices/lookup?name=devicename - Update device by name
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get("name");
    const body = await request.json();
    const { clerk_id, email, name, serial_number, location } = body;

    if (!deviceName || !clerk_id) {
      return NextResponse.json(
        { error: "Missing required parameters: name and clerk_id" },
        { status: 400 }
      );
    }

    // First check if device exists and belongs to user
    const existingDevices = await executeQuery<any[]>(
      "SELECT id FROM devices WHERE name = ? AND clerk_id = ?",
      [deviceName, clerk_id]
    );

    if (existingDevices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const deviceId = existingDevices[0].id;

    // Update the device
    await executeQuery(
      `UPDATE devices SET 
       email = ?, name = ?, serial_number = ?, location = ?, updated_at = NOW()
       WHERE id = ?`,
      [email, name || deviceName, serial_number, location, deviceId]
    );

    // Return updated device
    const updatedDevice = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE id = ?",
      [deviceId]
    );

    return NextResponse.json({
      message: "Device updated successfully",
      device: updatedDevice[0],
    });
  } catch (error) {
    console.error("Error updating device by name:", error);
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/lookup?name=devicename&clerk_id=user_id - Delete device by name
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get("name");
    const clerkId = searchParams.get("clerk_id");

    if (!deviceName || !clerkId) {
      return NextResponse.json(
        { error: "Missing required parameters: name and clerk_id" },
        { status: 400 }
      );
    }

    // Check if device exists and belongs to user
    const devices = await executeQuery<any[]>(
      "SELECT id FROM devices WHERE name = ? AND clerk_id = ?",
      [deviceName, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const deviceId = devices[0].id;

    // Delete the device (cascading will handle related records)
    await executeQuery("DELETE FROM devices WHERE id = ?", [deviceId]);

    return NextResponse.json({
      message: "Device deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting device by name:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
