import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

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

    // Verify device ownership and get settings
    const devices = await executeQuery<any[]>(
      `SELECT id, clerk_id, name, location, is_active,
              mail_delivered_notify, mailbox_opened_notify, mail_removed_notify,
              email_notifications, check_interval, battery_threshold,
              capture_image_on_open, capture_image_on_delivery
       FROM devices WHERE id = ? AND clerk_id = ?`,
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
    const {
      clerk_id,
      mail_delivered_notify,
      mailbox_opened_notify,
      mail_removed_notify,
      email_notifications,
      check_interval,
      battery_threshold,
      capture_image_on_open,
      capture_image_on_delivery,
    } = body;
    const resolvedParams = await params;
    const deviceId = resolvedParams.id;

    if (!clerk_id) {
      return NextResponse.json(
        { error: "clerk_id is required" },
        { status: 400 }
      );
    }

    // Verify device ownership
    const devices = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE id = ? AND clerk_id = ?",
      [deviceId, clerk_id]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    // Build update query with only provided fields
    const updateFields = [];
    const updateValues = [];

    if (mail_delivered_notify !== undefined) {
      updateFields.push("mail_delivered_notify = ?");
      updateValues.push(mail_delivered_notify ? 1 : 0);
    }
    if (mailbox_opened_notify !== undefined) {
      updateFields.push("mailbox_opened_notify = ?");
      updateValues.push(mailbox_opened_notify ? 1 : 0);
    }
    if (mail_removed_notify !== undefined) {
      updateFields.push("mail_removed_notify = ?");
      updateValues.push(mail_removed_notify ? 1 : 0);
    }
    if (email_notifications !== undefined) {
      updateFields.push("email_notifications = ?");
      updateValues.push(email_notifications ? 1 : 0);
    }
    if (check_interval !== undefined) {
      updateFields.push("check_interval = ?");
      updateValues.push(check_interval);
    }
    if (battery_threshold !== undefined) {
      updateFields.push("battery_threshold = ?");
      updateValues.push(battery_threshold);
    }
    if (capture_image_on_open !== undefined) {
      updateFields.push("capture_image_on_open = ?");
      updateValues.push(capture_image_on_open ? 1 : 0);
    }
    if (capture_image_on_delivery !== undefined) {
      updateFields.push("capture_image_on_delivery = ?");
      updateValues.push(capture_image_on_delivery ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No settings to update" },
        { status: 400 }
      );
    }

    // Add updated timestamp and device ID for WHERE clause
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(deviceId);

    await executeQuery(
      `UPDATE devices SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Return updated device settings
    const updatedDevice = await executeQuery<any[]>(
      `SELECT id, clerk_id, name, location, is_active,
              mail_delivered_notify, mailbox_opened_notify, mail_removed_notify,
              email_notifications, check_interval, battery_threshold,
              capture_image_on_open, capture_image_on_delivery,
              updated_at
       FROM devices WHERE id = ?`,
      [deviceId]
    );

    return NextResponse.json({
      message: "Device settings updated successfully",
      settings: updatedDevice[0],
    });
  } catch (error) {
    console.error("Error updating device settings:", error);
    return NextResponse.json(
      { error: "Failed to update device settings" },
      { status: 500 }
    );
  }
}
