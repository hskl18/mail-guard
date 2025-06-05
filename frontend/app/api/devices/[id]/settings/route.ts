import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Device, DeviceSettings } from "@/lib/types";

// GET /api/devices/[id]/settings - Get device settings
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
      `SELECT 
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
       FROM devices 
       WHERE id = ? AND clerk_id = ?`,
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
    console.error("Error fetching device settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch device settings" },
      { status: 500 }
    );
  }
}

// PUT /api/devices/[id]/settings - Update device settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { clerk_id } = body;
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
      "SELECT id FROM devices WHERE id = ? AND clerk_id = ?",
      [deviceId, clerk_id]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    const settingsFields = [
      "mail_delivered_notify",
      "mailbox_opened_notify",
      "mail_removed_notify",
      "battery_low_notify",
      "push_notifications",
      "email_notifications",
      "check_interval",
      "battery_threshold",
      "capture_image_on_open",
      "capture_image_on_delivery",
    ];

    settingsFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(body[field]);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No settings to update" },
        { status: 400 }
      );
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(deviceId);

    await executeQuery(
      `UPDATE devices SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Return updated settings
    const updatedSettings = await executeQuery<Device[]>(
      `SELECT 
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
       FROM devices 
       WHERE id = ?`,
      [deviceId]
    );

    return NextResponse.json({
      message: "Device settings updated successfully",
      settings: updatedSettings[0],
    });
  } catch (error) {
    console.error("Error updating device settings:", error);
    return NextResponse.json(
      { error: "Failed to update device settings" },
      { status: 500 }
    );
  }
}
