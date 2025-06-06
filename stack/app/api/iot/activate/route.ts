import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// POST /api/iot/activate - IoT device checking if serial number is valid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serial_number, firmware_version, device_type } = body;

    if (!serial_number) {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      );
    }

    // Check if serial number exists in valid serials table
    const validSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = 1",
      [serial_number]
    );

    if (validSerial.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid serial number",
          serial_number: serial_number,
          status: "invalid",
        },
        { status: 404 }
      );
    }

    const deviceInfo = validSerial[0];

    // Update or create device status record
    const existingStatus = await executeQuery<any[]>(
      "SELECT * FROM iot_device_status WHERE serial_number = ?",
      [serial_number]
    );

    if (existingStatus.length > 0) {
      // Update existing status
      await executeQuery(
        `UPDATE iot_device_status 
         SET last_seen = NOW(), 
             firmware_version = ?,
             is_online = 1, 
             device_type = ?
         WHERE serial_number = ?`,
        [
          firmware_version || existingStatus[0].firmware_version,
          device_type || existingStatus[0].device_type,
          serial_number,
        ]
      );
    } else {
      // Create new status record
      await executeQuery(
        `INSERT INTO iot_device_status 
         (serial_number, firmware_version, device_type, is_online, last_seen) 
         VALUES (?, ?, ?, 1, NOW())`,
        [
          serial_number,
          firmware_version || "1.0.0",
          device_type || "mailbox_monitor",
        ]
      );
    }

    return NextResponse.json({
      message: "Device serial number validated",
      serial_number: serial_number,
      status: "valid",
      is_claimed: deviceInfo.is_claimed,
      device_model: deviceInfo.device_model,
      can_operate: true,
      last_seen: new Date().toISOString(),
    });
  } catch (error) {
    console.error("IoT validation error:", error);
    return NextResponse.json(
      {
        error: "Device validation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/iot/activate?serial_number=XXX - Check device status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serial_number");

    if (!serialNumber) {
      return NextResponse.json(
        { error: "Serial number parameter is required" },
        { status: 400 }
      );
    }

    // Get device info from serials table
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ?",
      [serialNumber]
    );

    if (deviceSerial.length === 0) {
      return NextResponse.json(
        {
          error: "Serial number not found",
          serial_number: serialNumber,
          status: "invalid",
        },
        { status: 404 }
      );
    }

    // Get current device status
    const deviceStatus = await executeQuery<any[]>(
      "SELECT * FROM iot_device_status WHERE serial_number = ?",
      [serialNumber]
    );

    const serialInfo = deviceSerial[0];
    const statusInfo = deviceStatus.length > 0 ? deviceStatus[0] : null;

    return NextResponse.json({
      serial_number: serialNumber,
      is_valid: serialInfo.is_valid,
      is_claimed: serialInfo.is_claimed,
      claimed_by: serialInfo.claimed_by_clerk_id,
      claimed_at: serialInfo.claimed_at,
      device_model: serialInfo.device_model,
      manufactured_date: serialInfo.manufactured_date,
      status: statusInfo
        ? {
            is_online: statusInfo.is_online,
            last_seen: statusInfo.last_seen,
            firmware_version: statusInfo.firmware_version,
            battery_level: statusInfo.battery_level,
            signal_strength: statusInfo.signal_strength,
          }
        : null,
    });
  } catch (error) {
    console.error("IoT status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check device status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
