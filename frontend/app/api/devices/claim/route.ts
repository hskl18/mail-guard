import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// POST /api/devices/claim - User claims a device using serial number
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serial_number, device_name, location } = body;

    if (!serial_number) {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      );
    }

    // Check if serial number exists and is valid
    const validSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = TRUE",
      [serial_number]
    );

    if (validSerial.length === 0) {
      return NextResponse.json(
        {
          error:
            "Invalid serial number. Please check the serial number on your device.",
          serial_number: serial_number,
        },
        { status: 404 }
      );
    }

    const serialInfo = validSerial[0];

    // Check if already claimed by another user
    if (serialInfo.is_claimed && serialInfo.claimed_by_clerk_id !== userId) {
      return NextResponse.json(
        {
          error: "This device has already been claimed by another user",
          serial_number: serial_number,
        },
        { status: 409 }
      );
    }

    // Check if user already has a device with this serial number
    const existingDevice = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE clerk_id = ? AND serial_number = ?",
      [userId, serial_number]
    );

    if (existingDevice.length > 0) {
      return NextResponse.json(
        {
          error: "You have already claimed this device",
          device: existingDevice[0],
        },
        { status: 409 }
      );
    }

    // Get user email (we might need this for the devices table)
    const user = await executeQuery<any[]>(
      "SELECT email FROM devices WHERE clerk_id = ? LIMIT 1",
      [userId]
    );
    const userEmail = user.length > 0 ? user[0].email : `${userId}@example.com`;

    // Create device record in devices table
    const deviceResult = await executeQuery(
      `INSERT INTO devices 
       (clerk_id, email, name, serial_number, location, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
      [
        userId,
        userEmail,
        device_name || `Mailbox ${serial_number}`,
        serial_number,
        location || "Not specified",
      ]
    );

    // Mark serial as claimed
    await executeQuery(
      `UPDATE device_serials 
       SET is_claimed = TRUE, claimed_by_clerk_id = ?, claimed_at = CURRENT_TIMESTAMP
       WHERE serial_number = ?`,
      [userId, serial_number]
    );

    return NextResponse.json(
      {
        message: "Device claimed successfully",
        device: {
          id: (deviceResult as any).insertId,
          name: device_name || `Mailbox ${serial_number}`,
          serial_number: serial_number,
          location: location || "Not specified",
          device_model: serialInfo.device_model,
          claimed_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Device claim error:", error);
    return NextResponse.json(
      {
        error: "Failed to claim device",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
