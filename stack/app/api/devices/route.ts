import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { Device, DevicePayload } from "@/lib/types";

// GET /api/devices - Get devices with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const clerkId = searchParams.get("clerk_id");
    const isActive = searchParams.get("is_active");

    let query = "SELECT * FROM devices WHERE 1=1";
    const params: any[] = [];

    if (name) {
      query += " AND name LIKE ?";
      params.push(`%${name}%`);
    }

    if (clerkId) {
      query += " AND clerk_id = ?";
      params.push(clerkId);
    }

    if (isActive !== null) {
      query += " AND is_active = ?";
      params.push(isActive === "true");
    }

    query += " ORDER BY created_at DESC";

    const devices = await executeQuery<Device[]>(query, params);
    return NextResponse.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

// POST /api/devices - Create a new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerk_id, email, name, serial_number, location } = body;

    if (!clerk_id || !name || !serial_number) {
      return NextResponse.json(
        { error: "Missing required fields: clerk_id, name, serial_number" },
        { status: 400 }
      );
    }

    // Check if user already has a device
    const existingDevices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE clerk_id = ?",
      [clerk_id]
    );

    if (existingDevices.length > 0) {
      // User already has a device, return the existing one with a message
      return NextResponse.json(
        {
          message: "User already has a device. Returning existing device.",
          device: existingDevices[0],
          existing: true,
        },
        { status: 200 }
      );
    }

    // Create new device
    const result = await executeQuery(
      `INSERT INTO devices(
        clerk_id,
        email,
        name,
        serial_number,
        location,
        is_active,
        mail_delivered_notify,
        mailbox_opened_notify,
        mail_removed_notify,
        battery_low_notify,
        push_notifications,
        email_notifications,
        check_interval,
        battery_threshold,
        capture_image_on_open,
        capture_image_on_delivery
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        clerk_id,
        email || "", // Default empty email since it's not required anymore
        name,
        serial_number,
        location || "Device Location", // Use provided location or default
        true, // is_active
        true, // mail_delivered_notify
        true, // mailbox_opened_notify
        true, // mail_removed_notify
        true, // battery_low_notify
        true, // push_notifications
        true, // email_notifications
        30, // check_interval (seconds)
        20, // battery_threshold (%)
        true, // capture_image_on_open
        true, // capture_image_on_delivery
      ]
    );

    // Get the created device
    const insertResult = result as any;
    const newDevice = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE id = ?",
      [insertResult.insertId]
    );

    return NextResponse.json(
      {
        message: "Device created successfully",
        device: newDevice[0],
        existing: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating device:", error);

    // Handle specific database errors
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return NextResponse.json(
        {
          error:
            "User already has a device. Each user can only have one device.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create device" },
      { status: 500 }
    );
  }
}
