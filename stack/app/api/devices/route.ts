import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { Device, DevicePayload } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import {
  createSecurityResponse,
  logSecurityEvent,
  checkRateLimit,
  hashApiKey,
} from "@/lib/api-security";

// GET /api/devices - Get devices with optional filtering (SECURED)
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require user authentication
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "DEVICES_GET_UNAUTHORIZED",
        {
          url: request.url,
        },
        request
      );

      return createSecurityResponse("Authentication required", 401);
    }

    // SECURITY: Rate limiting
    if (!checkRateLimit(`user_${userId}`, 1000)) {
      // 1000 requests per hour for users
      logSecurityEvent(
        "DEVICES_GET_RATE_LIMITED",
        {
          userId,
        },
        request
      );

      return createSecurityResponse(
        "Rate limit exceeded. Please try again later",
        429
      );
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const clerkId = searchParams.get("clerk_id");
    const isActive = searchParams.get("is_active");

    // SECURITY: Users can only access their own devices unless they're admin
    // For now, enforce users can only see their own devices
    let query = "SELECT * FROM devices WHERE clerk_id = ?";
    const params: any[] = [userId];

    if (name) {
      query += " AND name LIKE ?";
      params.push(`%${name}%`);
    }

    if (isActive !== null) {
      query += " AND is_active = ?";
      params.push(isActive === "true");
    }

    query += " ORDER BY created_at DESC";

    const devices = await executeQuery<Device[]>(query, params);

    logSecurityEvent(
      "DEVICES_RETRIEVED",
      {
        userId,
        deviceCount: devices.length,
        filters: { name, isActive },
      },
      request
    );

    return NextResponse.json(devices);
  } catch (error) {
    logSecurityEvent(
      "DEVICES_GET_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      request
    );

    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

// POST /api/devices - Create a new device (SECURED)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require user authentication
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "DEVICES_CREATE_UNAUTHORIZED",
        {
          url: request.url,
        },
        request
      );

      return createSecurityResponse("Authentication required", 401);
    }

    // SECURITY: Rate limiting
    if (!checkRateLimit(`user_${userId}`, 1000)) {
      // 1000 requests per hour for users
      logSecurityEvent(
        "DEVICES_CREATE_RATE_LIMITED",
        {
          userId,
        },
        request
      );

      return createSecurityResponse(
        "Rate limit exceeded. Please try again later",
        429
      );
    }

    const body = await request.json();
    const { clerk_id, email, name, serial_number, location } = body;

    // SECURITY: Validate required fields
    if (!name || !serial_number) {
      logSecurityEvent(
        "DEVICES_CREATE_INVALID_DATA",
        {
          userId,
          hasName: !!name,
          hasSerialNumber: !!serial_number,
        },
        request
      );

      return createSecurityResponse(
        "Missing required fields: name, serial_number",
        400
      );
    }

    // SECURITY: Ensure user can only create devices for themselves
    const effectiveClerkId = clerk_id || userId;
    if (effectiveClerkId !== userId) {
      logSecurityEvent(
        "DEVICES_CREATE_UNAUTHORIZED_USER",
        {
          userId,
          attemptedClerkId: effectiveClerkId,
        },
        request
      );

      return createSecurityResponse(
        "Cannot create device for different user",
        403
      );
    }

    // SECURITY: Validate serial number format (basic validation)
    if (typeof serial_number !== "string" || serial_number.length < 3) {
      logSecurityEvent(
        "DEVICES_CREATE_INVALID_SERIAL",
        {
          userId,
          serialNumber: serial_number,
        },
        request
      );

      return createSecurityResponse("Invalid serial number format", 400);
    }

    // Check if user already has a device
    const existingDevices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE clerk_id = ?",
      [effectiveClerkId]
    );

    if (existingDevices.length > 0) {
      logSecurityEvent(
        "DEVICES_CREATE_ALREADY_EXISTS",
        {
          userId,
          existingDeviceId: existingDevices[0].id,
        },
        request
      );

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

    // SECURITY: Check if serial number is already in use
    const existingSerial = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE serial_number = ?",
      [serial_number]
    );

    if (existingSerial.length > 0) {
      logSecurityEvent(
        "DEVICES_CREATE_SERIAL_IN_USE",
        {
          userId,
          serialNumber: serial_number,
          existingDeviceId: existingSerial[0].id,
        },
        request
      );

      return createSecurityResponse("Serial number already in use", 409);
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
        effectiveClerkId,
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

    logSecurityEvent(
      "DEVICE_CREATED",
      {
        userId,
        deviceId: insertResult.insertId,
        serialNumber: serial_number,
        deviceName: name,
      },
      request
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
    logSecurityEvent(
      "DEVICES_CREATE_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("Error creating device:", error);

    // Handle specific database errors
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return NextResponse.json(
        {
          error: "Device already exists with this information.",
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
