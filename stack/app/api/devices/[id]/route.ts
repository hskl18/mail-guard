import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Device } from "@/lib/types";

// GET /api/devices/[id] - Get a specific device
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerk_id");
    const resolvedParams = await params;
    const deviceId = resolvedParams.id;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { clerk_id, name, serial_number, location, is_active } = body;
    const resolvedParams = await params;
    const deviceId = resolvedParams.id;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerk_id");
    const resolvedParams = await params;
    const deviceId = resolvedParams.id;

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

    const device = devices[0];
    const serialNumber = device.serial_number;

    console.log(
      `Deleting device ${deviceId} with serial ${serialNumber} for user ${clerkId}`
    );

    // Start comprehensive cleanup process
    let deletedCounts = {
      events: 0,
      images: 0,
      notifications: 0,
      health_records: 0,
      iot_events: 0,
      iot_images: 0,
      iot_status: 0,
      device_serial: 0,
    };

    try {
      // 1. Delete dashboard-related data first
      const eventsResult = await executeQuery(
        "DELETE FROM events WHERE device_id = ?",
        [deviceId]
      );
      deletedCounts.events = (eventsResult as any).affectedRows || 0;

      const imagesResult = await executeQuery(
        "DELETE FROM images WHERE device_id = ?",
        [deviceId]
      );
      deletedCounts.images = (imagesResult as any).affectedRows || 0;

      const notificationsResult = await executeQuery(
        "DELETE FROM notifications WHERE device_id = ?",
        [deviceId]
      );
      deletedCounts.notifications =
        (notificationsResult as any).affectedRows || 0;

      const healthResult = await executeQuery(
        "DELETE FROM device_health WHERE device_id = ?",
        [deviceId]
      );
      deletedCounts.health_records = (healthResult as any).affectedRows || 0;

      // 2. Delete IoT-specific data if serial number exists
      if (serialNumber) {
        console.log(`Cleaning up IoT data for serial: ${serialNumber}`);

        const iotEventsResult = await executeQuery(
          "DELETE FROM iot_events WHERE serial_number = ?",
          [serialNumber]
        );
        deletedCounts.iot_events = (iotEventsResult as any).affectedRows || 0;

        const iotImagesResult = await executeQuery(
          "DELETE FROM iot_images WHERE serial_number = ?",
          [serialNumber]
        );
        deletedCounts.iot_images = (iotImagesResult as any).affectedRows || 0;

        const iotStatusResult = await executeQuery(
          "DELETE FROM iot_device_status WHERE serial_number = ?",
          [serialNumber]
        );
        deletedCounts.iot_status = (iotStatusResult as any).affectedRows || 0;

        // 3. Unclaim the device serial (but don't delete the serial record itself)
        const deviceSerialResult = await executeQuery(
          "UPDATE device_serials SET claimed_by_clerk_id = NULL, claimed_at = NULL WHERE serial_number = ? AND claimed_by_clerk_id = ?",
          [serialNumber, clerkId]
        );
        deletedCounts.device_serial =
          (deviceSerialResult as any).affectedRows || 0;
      }

      // 4. Finally delete the device record
      await executeQuery("DELETE FROM devices WHERE id = ?", [deviceId]);

      console.log("Device deletion completed:", deletedCounts);

      return NextResponse.json({
        message: "Device and all associated data deleted successfully",
        deleted_data: deletedCounts,
        device_id: deviceId,
        serial_number: serialNumber,
      });
    } catch (cleanupError) {
      console.error("Error during device cleanup:", cleanupError);
      return NextResponse.json(
        {
          error: "Failed to completely clean up device data",
          message:
            cleanupError instanceof Error
              ? cleanupError.message
              : "Unknown cleanup error",
          partial_cleanup: deletedCounts,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting device:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
