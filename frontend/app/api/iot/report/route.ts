import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET /api/iot/report - IoT device reporting endpoint (minimal payload)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("d"); // Short parameter name for IoT devices (legacy)
    const deviceName = searchParams.get("device_name"); // New device name parameter
    const event = searchParams.get("e"); // 'o' for open, 'c' for close

    if ((!deviceId && !deviceName) || !event) {
      return NextResponse.json(
        { error: "Missing required parameters: (d or device_name), e (event)" },
        { status: 400 }
      );
    }

    // Map short event codes to full event types
    const eventMap: { [key: string]: string } = {
      o: "open",
      c: "close",
      d: "delivery",
      r: "removal",
    };

    const eventType = eventMap[event.toLowerCase()];
    if (!eventType) {
      return NextResponse.json(
        {
          error:
            "Invalid event code. Use: o (open), c (close), d (delivery), r (removal)",
        },
        { status: 400 }
      );
    }

    // Check if device exists (by ID or name)
    let devices: any[];
    let actualDeviceId: string;

    if (deviceName) {
      devices = await executeQuery<any[]>(
        "SELECT id, clerk_id FROM devices WHERE name = ?",
        [deviceName]
      );
    } else {
      devices = await executeQuery<any[]>(
        "SELECT id, clerk_id FROM devices WHERE id = ?",
        [deviceId]
      );
    }

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const device = devices[0];
    actualDeviceId = device.id;

    // Create event record
    const result = await executeQuery(
      `INSERT INTO events (device_id, event_type, clerk_id, occurred_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [actualDeviceId, eventType, device.clerk_id]
    );

    // Update device last_seen
    await executeQuery(
      "UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?",
      [actualDeviceId]
    );

    // Return minimal response for IoT devices
    return NextResponse.json({
      status: "ok",
      event_id: (result as any).insertId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing IoT report:", error);

    // Return minimal error response for IoT devices
    return NextResponse.json(
      { status: "error", message: "Processing failed" },
      { status: 500 }
    );
  }
}
