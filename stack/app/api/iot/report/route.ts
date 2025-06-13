import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import {
  authenticateIoTDevice,
  createSecurityResponse,
  logSecurityEvent,
} from "@/lib/api-security";

// POST /api/iot/report - Device Status Reports (SECURED)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate IoT device first
    const authResult = await authenticateIoTDevice(request);

    if (!authResult.success) {
      logSecurityEvent(
        "IOT_REPORT_AUTH_FAILED",
        {
          error: authResult.error,
          url: request.url,
        },
        request
      );

      return createSecurityResponse(
        authResult.error || "Authentication failed",
        authResult.statusCode || 401
      );
    }

    const body = await request.json();
    const {
      serial_number,
      firmware_version,
      battery_level,
      signal_strength,
      temperature_celsius,
    } = body;

    // SECURITY: Validate required fields
    if (!serial_number) {
      logSecurityEvent(
        "IOT_REPORT_MISSING_SERIAL",
        {
          deviceSerial: authResult.deviceSerial,
          payload: body,
        },
        request
      );

      return createSecurityResponse("Serial number is required", 400);
    }

    // SECURITY: Verify the authenticated device matches the serial number in payload
    if (authResult.deviceSerial && authResult.deviceSerial !== serial_number) {
      logSecurityEvent(
        "IOT_REPORT_SERIAL_MISMATCH",
        {
          authenticatedSerial: authResult.deviceSerial,
          payloadSerial: serial_number,
        },
        request
      );

      return createSecurityResponse("Device serial number mismatch", 403);
    }

    // Validate data types and ranges
    if (battery_level !== undefined) {
      if (
        typeof battery_level !== "number" ||
        battery_level < 0 ||
        battery_level > 100
      ) {
        return createSecurityResponse(
          "Battery level must be between 0 and 100",
          400
        );
      }
    }

    if (signal_strength !== undefined) {
      if (
        typeof signal_strength !== "number" ||
        signal_strength < -120 ||
        signal_strength > 0
      ) {
        return createSecurityResponse(
          "Signal strength must be between -120 and 0 dBm",
          400
        );
      }
    }

    if (temperature_celsius !== undefined) {
      if (
        typeof temperature_celsius !== "number" ||
        temperature_celsius < -50 ||
        temperature_celsius > 80
      ) {
        return createSecurityResponse(
          "Temperature must be between -50 and 80 celsius",
          400
        );
      }
    }

    // Check if device serial is valid
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = 1",
      [serial_number]
    );

    if (deviceSerial.length === 0) {
      logSecurityEvent(
        "IOT_REPORT_INVALID_SERIAL",
        {
          serial_number,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse(
        `Invalid device serial number: ${serial_number}. Device not recognized`,
        404
      );
    }

    // Update IoT device status
    await executeQuery(
      `UPDATE iot_device_status 
       SET 
         last_seen = NOW(), 
         is_online = 1,
         firmware_version = COALESCE(?, firmware_version),
         battery_level = COALESCE(?, battery_level),
         signal_strength = COALESCE(?, signal_strength),
         temperature_celsius = COALESCE(?, temperature_celsius)
       WHERE serial_number = ?`,
      [
        firmware_version,
        battery_level,
        signal_strength,
        temperature_celsius,
        serial_number,
      ]
    );

    // Check if device is claimed by a user (linked to dashboard)
    const dashboardDevice = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE serial_number = ?",
      [serial_number]
    );

    let result = null;

    if (dashboardDevice.length > 0) {
      // Update dashboard device status as well
      const deviceId = dashboardDevice[0].id;

      await executeQuery(
        `UPDATE devices 
         SET 
           last_seen = NOW(),
           battery_level = COALESCE(?, battery_level),
           signal_strength = COALESCE(?, signal_strength),
           firmware_version = COALESCE(?, firmware_version)
         WHERE id = ?`,
        [battery_level, signal_strength, firmware_version, deviceId]
      );

      // Create a heartbeat event
      result = await executeQuery(
        `INSERT INTO events (device_id, event_type, clerk_id, occurred_at) 
         VALUES (?, 'heartbeat', ?, NOW())`,
        [deviceId, dashboardDevice[0].clerk_id]
      );
    }

    // Log low battery warnings
    if (battery_level !== undefined && battery_level <= 20) {
      logSecurityEvent(
        "IOT_LOW_BATTERY_WARNING",
        {
          serial_number,
          battery_level,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );
    }

    logSecurityEvent(
      "IOT_REPORT_STATUS_UPDATED",
      {
        serial_number,
        firmware_version,
        battery_level,
        signal_strength,
        temperature_celsius,
        deviceSerial: authResult.deviceSerial,
        event_id: result ? (result as any).insertId : null,
      },
      request
    );

    return NextResponse.json({
      message: "Status report received successfully",
      timestamp: new Date().toISOString(),
      status: "acknowledged",
      battery_warning: battery_level !== undefined && battery_level <= 20,
    });
  } catch (error) {
    logSecurityEvent(
      "IOT_REPORT_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("Error processing IoT status report:", error);

    return createSecurityResponse("Internal server error", 500);
  }
}

// GET /api/iot/report - Legacy IoT device reporting endpoint (SECURED - minimal payload)
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Authenticate IoT device first
    const authResult = await authenticateIoTDevice(request);

    if (!authResult.success) {
      logSecurityEvent(
        "IOT_REPORT_AUTH_FAILED",
        {
          error: authResult.error,
          url: request.url,
        },
        request
      );

      return createSecurityResponse(
        authResult.error || "Authentication failed",
        authResult.statusCode || 401
      );
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("d"); // Short parameter name for IoT devices (legacy)
    const deviceName = searchParams.get("device_name"); // New device name parameter
    const event = searchParams.get("e"); // 'o' for open, 'c' for close

    if ((!deviceId && !deviceName) || !event) {
      logSecurityEvent(
        "IOT_REPORT_INVALID_PARAMS",
        {
          deviceId,
          deviceName,
          event,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse(
        "Missing required parameters: (d or device_name), e (event)",
        400
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
      logSecurityEvent(
        "IOT_REPORT_INVALID_EVENT",
        {
          eventCode: event,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse(
        "Invalid event code. Use: o (open), c (close), d (delivery), r (removal)",
        400
      );
    }

    // Check if device exists (by ID or name)
    let devices: any[];
    let actualDeviceId: string;

    if (deviceName) {
      devices = await executeQuery<any[]>(
        "SELECT id, clerk_id, serial_number FROM devices WHERE name = ?",
        [deviceName]
      );
    } else {
      devices = await executeQuery<any[]>(
        "SELECT id, clerk_id, serial_number FROM devices WHERE id = ?",
        [deviceId]
      );
    }

    if (devices.length === 0) {
      logSecurityEvent(
        "IOT_REPORT_DEVICE_NOT_FOUND",
        {
          deviceId,
          deviceName,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse("Device not found", 404);
    }

    const device = devices[0];
    actualDeviceId = device.id;

    // SECURITY: Additional validation - if we have device serial from auth,
    // verify it matches the device being reported for
    if (
      authResult.deviceSerial &&
      device.serial_number &&
      authResult.deviceSerial !== device.serial_number
    ) {
      logSecurityEvent(
        "IOT_REPORT_DEVICE_MISMATCH",
        {
          authenticatedSerial: authResult.deviceSerial,
          deviceSerial: device.serial_number,
          deviceId: actualDeviceId,
        },
        request
      );

      return createSecurityResponse(
        "Cannot report events for different device",
        403
      );
    }

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

    logSecurityEvent(
      "IOT_REPORT_EVENT_CREATED",
      {
        device_id: actualDeviceId,
        event_type: eventType,
        event_id: (result as any).insertId,
        clerk_id: device.clerk_id,
        deviceSerial: authResult.deviceSerial,
      },
      request
    );

    // Return minimal response for IoT devices
    return NextResponse.json({
      status: "ok",
      event_id: (result as any).insertId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logSecurityEvent(
      "IOT_REPORT_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("Error processing IoT report:", error);

    // Return minimal error response for IoT devices
    return NextResponse.json(
      { status: "error", message: "Processing failed" },
      { status: 500 }
    );
  }
}
