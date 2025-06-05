import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Device } from "@/lib/types";

// GET /api/devices/[id] - Get a specific device
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerk_id");
    const deviceId = params.id;

    if (!clerkId) {
      return NextResponse.json(
        { error: "clerk_id parameter is required" },
        { status: 400 }
      );
    }

    const devices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE id = ? AND clerk_id = ?",
      [deviceId, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(devices[0]);
  } catch (error) {
    console.error("Error fetching device:", error);
    return NextResponse.json(
      { error: "Failed to fetch device" },
      { status: 500 }
    );
  }
}

// PUT /api/devices/[id] - Update a specific device
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { clerk_id, name, serial_number, location, is_active } = body;
    const deviceId = params.id;

    if (!clerk_id) {
      return NextResponse.json(
        { error: "clerk_id is required" },
        { status: 400 }
      );
    }

    // Verify device ownership
    const devices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE id = ? AND clerk_id = ?",
      [deviceId, clerk_id]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    // Update device
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (serial_number !== undefined) {
      updateFields.push("serial_number = ?");
      updateValues.push(serial_number);
    }
    if (location !== undefined) {
      updateFields.push("location = ?");
      updateValues.push(location);
    }
    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(deviceId);

    await executeQuery(
      `UPDATE devices SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Return updated device
    const updatedDevice = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE id = ?",
      [deviceId]
    );

    return NextResponse.json({
      message: "Device updated successfully",
      device: updatedDevice[0],
    });
  } catch (error) {
    console.error("Error updating device:", error);
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/[id] - Delete a specific device
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerk_id");
    const deviceId = params.id;

    if (!clerkId) {
      return NextResponse.json(
        { error: "clerk_id parameter is required" },
        { status: 400 }
      );
    }

    // Verify device ownership
    const devices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE id = ? AND clerk_id = ?",
      [deviceId, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    // Delete device (cascades to related tables)
    await executeQuery("DELETE FROM devices WHERE id = ?", [deviceId]);

    return NextResponse.json({
      message: "Device deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting device:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
