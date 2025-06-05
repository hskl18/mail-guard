import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { DeviceHealth } from "@/lib/types";

// POST /api/devices/[id]/health - Update device health metrics
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const deviceId = parseInt(resolvedParams.id);

  try {
    const body: DeviceHealth = await request.json();

    if (!body.clerk_id) {
      return NextResponse.json(
        { error: "clerk_id is required" },
        { status: 400 }
      );
    }

    // First, check if the device exists and belongs to the user
    const devices = await executeQuery<any[]>(
      "SELECT id FROM devices WHERE id=? AND clerk_id=?",
      [deviceId, body.clerk_id]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Insert health metrics into device_health table
    await executeQuery<any>(
      `INSERT INTO device_health (
        device_id,
        battery_level,
        signal_strength,
        temperature,
        firmware_version
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        deviceId,
        body.battery_level || null,
        body.signal_strength || null,
        body.temperature || null,
        body.firmware_version || null,
      ]
    );

    // Check if battery is below threshold and send notification if needed
    if (body.battery_level !== undefined) {
      const device = await executeQuery<any[]>(
        `SELECT 
          battery_threshold,
          battery_low_notify
        FROM devices
        WHERE id=? AND clerk_id=?`,
        [deviceId, body.clerk_id]
      );

      if (
        device.length > 0 &&
        device[0].battery_low_notify &&
        body.battery_level < device[0].battery_threshold
      ) {
        // Insert battery low notification
        await executeQuery<any>(
          `INSERT INTO notifications (
            device_id,
            notification_type
          ) VALUES (?, 'battery_low')`,
          [deviceId]
        );
      }
    }

    return NextResponse.json({ id: deviceId });
  } catch (error) {
    console.error("Error updating device health:", error);
    return NextResponse.json(
      { error: "Failed to update device health" },
      { status: 500 }
    );
  }
}
