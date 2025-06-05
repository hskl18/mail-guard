import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Device } from "@/lib/types";

// POST /api/devices/[id]/heartbeat - Send device heartbeat
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { clerk_id } = body;
    const deviceId = params.id;

    if (!clerk_id) {
      return NextResponse.json(
        { error: "clerk_id is required" },
        { status: 400 }
      );
    }

    // Verify device ownership
    const devices = await executeQuery<Device[]>(
      "SELECT id FROM devices WHERE id = ? AND clerk_id = ?",
      [deviceId, clerk_id]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    // Update last_seen timestamp
    await executeQuery(
      "UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?",
      [deviceId]
    );

    // Optionally create a heartbeat log entry (if you want to track heartbeats)
    try {
      await executeQuery(
        `INSERT INTO device_health (device_id, clerk_id, reported_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [deviceId, clerk_id]
      );
    } catch (error) {
      // If device_health table doesn't exist or insert fails, just log but don't fail the heartbeat
      console.log(
        "Heartbeat logged to last_seen only (device_health table may not exist)"
      );
    }

    return NextResponse.json({
      message: "Heartbeat received successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing heartbeat:", error);
    return NextResponse.json(
      { error: "Failed to process heartbeat" },
      { status: 500 }
    );
  }
}
