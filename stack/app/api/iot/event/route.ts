import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// POST /api/iot/event - Push event from IoT device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serial_number,
      event_data,
      timestamp,
      firmware_version,
      battery_level,
      signal_strength,
    } = body;

    if (!serial_number) {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      );
    }

    if (!event_data) {
      return NextResponse.json(
        { error: "Event data is required" },
        { status: 400 }
      );
    }

    // Validate event data structure
    const { reed_sensor, event_type, mailbox_status } = event_data;

    if (reed_sensor === undefined) {
      return NextResponse.json(
        { error: "reed_sensor status is required in event_data" },
        { status: 400 }
      );
    }

    // Check if device serial is valid
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = TRUE",
      [serial_number]
    );

    if (deviceSerial.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid device serial number",
          serial_number: serial_number,
          action: "Device not recognized",
        },
        { status: 404 }
      );
    }

    const serialInfo = deviceSerial[0];

    // Update or create device status
    const existingStatus = await executeQuery<any[]>(
      "SELECT * FROM iot_device_status WHERE serial_number = ?",
      [serial_number]
    );

    if (existingStatus.length > 0) {
      // Update existing status
      await executeQuery(
        `UPDATE iot_device_status 
         SET last_seen = CURRENT_TIMESTAMP, 
             firmware_version = COALESCE(?, firmware_version),
             battery_level = COALESCE(?, battery_level),
             signal_strength = COALESCE(?, signal_strength),
             is_online = TRUE
         WHERE serial_number = ?`,
        [firmware_version, battery_level, signal_strength, serial_number]
      );
    } else {
      // Create new status record
      await executeQuery(
        `INSERT INTO iot_device_status 
         (serial_number, firmware_version, battery_level, signal_strength, is_online, last_seen) 
         VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
        [
          serial_number,
          firmware_version || "1.0.0",
          battery_level,
          signal_strength,
        ]
      );
    }

    // Map reed sensor and event type to standardized event
    let standardEventType = "unknown";

    if (event_type) {
      // Use provided event type if available
      switch (event_type.toLowerCase()) {
        case "open":
        case "opened":
          standardEventType = "open";
          break;
        case "close":
        case "closed":
          standardEventType = "close";
          break;
        case "delivery":
        case "mail_delivered":
          standardEventType = "delivery";
          break;
        case "removal":
        case "mail_removed":
          standardEventType = "removal";
          break;
        default:
          standardEventType = reed_sensor ? "open" : "close";
      }
    } else {
      // Infer from reed sensor status
      standardEventType = reed_sensor ? "open" : "close";
    }

    // Check if device is claimed by a user (linked to dashboard)
    const dashboardDevice = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE serial_number = ?",
      [serial_number]
    );

    let deviceId = null;
    let clerkId = serialInfo.claimed_by_clerk_id;

    if (dashboardDevice.length > 0) {
      deviceId = dashboardDevice[0].id;
      clerkId = dashboardDevice[0].clerk_id;
    }

    // Create event record
    const eventTimestamp = timestamp || new Date().toISOString();

    if (deviceId && clerkId) {
      // Store in events table if device is claimed and linked to dashboard
      const eventResult = await executeQuery(
        `INSERT INTO events (device_id, event_type, clerk_id, occurred_at) 
         VALUES (?, ?, ?, ?)`,
        [deviceId, standardEventType, clerkId, eventTimestamp]
      );

      // Store health data if provided
      if (battery_level !== undefined || signal_strength !== undefined) {
        await executeQuery(
          `INSERT INTO device_health (device_id, clerk_id, battery_level, signal_strength, firmware_version, reported_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [deviceId, clerkId, battery_level, signal_strength, firmware_version]
        );
      }

      // Create notification if needed (for important events)
      if (standardEventType === "open" || standardEventType === "delivery") {
        await executeQuery(
          `INSERT INTO notifications (device_id, notification_type, message, sent_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            deviceId,
            `mailbox_${standardEventType}`,
            `Mailbox ${
              standardEventType === "open" ? "opened" : "delivery detected"
            } - ${dashboardDevice[0].name || serial_number}`,
          ]
        );
      }

      return NextResponse.json({
        message: "Event recorded successfully",
        event_id: (eventResult as any).insertId,
        event_type: standardEventType,
        device_id: deviceId,
        serial_number: serial_number,
        status: "claimed_device",
        processed_at: new Date().toISOString(),
      });
    } else {
      // Store in IoT events table if device is not claimed or not linked
      const iotEventResult = await executeQuery(
        `INSERT INTO iot_events (serial_number, event_type, event_data, occurred_at) 
         VALUES (?, ?, ?, ?)`,
        [
          serial_number,
          standardEventType,
          JSON.stringify(event_data),
          eventTimestamp,
        ]
      );

      return NextResponse.json({
        message: "IoT event recorded (unclaimed device)",
        iot_event_id: (iotEventResult as any).insertId,
        event_type: standardEventType,
        serial_number: serial_number,
        status: serialInfo.is_claimed ? "claimed_but_not_linked" : "unclaimed",
        note: "Claim device in dashboard for full integration",
        processed_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("IoT event error:", error);
    return NextResponse.json(
      {
        error: "Failed to process event",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/iot/event?serial_number=XXX - Get recent events for IoT device
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serial_number");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!serialNumber) {
      return NextResponse.json(
        { error: "Serial number parameter is required" },
        { status: 400 }
      );
    }

    // Check if device serial exists
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ?",
      [serialNumber]
    );

    if (deviceSerial.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Try to get events from main events table first (if claimed)
    const dashboardEvents = await executeQuery<any[]>(
      `SELECT e.*, d.name as device_name 
       FROM events e 
       LEFT JOIN devices d ON e.device_id = d.id 
       WHERE d.serial_number = ?
       ORDER BY e.occurred_at DESC 
       LIMIT ?`,
      [serialNumber, limit]
    );

    // Also get IoT-specific events
    const iotEvents = await executeQuery<any[]>(
      `SELECT * FROM iot_events 
       WHERE serial_number = ? 
       ORDER BY occurred_at DESC 
       LIMIT ?`,
      [serialNumber, limit]
    );

    // Get device status
    const deviceStatus = await executeQuery<any[]>(
      "SELECT * FROM iot_device_status WHERE serial_number = ?",
      [serialNumber]
    );

    return NextResponse.json({
      serial_number: serialNumber,
      is_claimed: deviceSerial[0].is_claimed,
      device_model: deviceSerial[0].device_model,
      dashboard_events: dashboardEvents,
      iot_events: iotEvents,
      total_events: dashboardEvents.length + iotEvents.length,
      device_status: deviceStatus.length > 0 ? deviceStatus[0] : null,
    });
  } catch (error) {
    console.error("IoT get events error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve events",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
