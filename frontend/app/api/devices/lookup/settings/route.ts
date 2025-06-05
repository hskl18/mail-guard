import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET /api/devices/lookup/settings?name=devicename&clerk_id=user_id - Get device settings by name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get("name");
    const clerkId = searchParams.get("clerk_id");

    if (!deviceName || !clerkId) {
      return NextResponse.json(
        { error: "Missing required parameters: name and clerk_id" },
        { status: 400 }
      );
    }

    const devices = await executeQuery<any[]>(
      `SELECT mail_delivered_notify, mailbox_opened_notify, mail_removed_notify, 
       battery_low_notify, push_notifications, email_notifications, 
       check_interval, battery_threshold, capture_image_on_open, capture_image_on_delivery
       FROM devices WHERE name = ? AND clerk_id = ?`,
      [deviceName, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json(devices[0]);
  } catch (error) {
    console.error("Error fetching device settings by name:", error);
    return NextResponse.json(
      { error: "Failed to fetch device settings" },
      { status: 500 }
    );
  }
}

// PUT /api/devices/lookup/settings?name=devicename&clerk_id=user_id - Update device settings by name
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get("name");
    const clerkId = searchParams.get("clerk_id");
    const body = await request.json();

    if (!deviceName || !clerkId) {
      return NextResponse.json(
        { error: "Missing required parameters: name and clerk_id" },
        { status: 400 }
      );
    }

    // Check if device exists and belongs to user
    const devices = await executeQuery<any[]>(
      "SELECT id FROM devices WHERE name = ? AND clerk_id = ?",
      [deviceName, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const deviceId = devices[0].id;

    // Update device settings
    const {
      mail_delivered_notify,
      mailbox_opened_notify,
      mail_removed_notify,
      battery_low_notify,
      push_notifications,
      email_notifications,
      check_interval,
      battery_threshold,
      capture_image_on_open,
      capture_image_on_delivery,
    } = body;

    await executeQuery(
      `UPDATE devices SET 
       mail_delivered_notify = ?, mailbox_opened_notify = ?, mail_removed_notify = ?,
       battery_low_notify = ?, push_notifications = ?, email_notifications = ?,
       check_interval = ?, battery_threshold = ?, capture_image_on_open = ?,
       capture_image_on_delivery = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        mail_delivered_notify,
        mailbox_opened_notify,
        mail_removed_notify,
        battery_low_notify,
        push_notifications,
        email_notifications,
        check_interval,
        battery_threshold,
        capture_image_on_open,
        capture_image_on_delivery,
        deviceId,
      ]
    );

    return NextResponse.json({
      message: "Device settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating device settings by name:", error);
    return NextResponse.json(
      { error: "Failed to update device settings" },
      { status: 500 }
    );
  }
}
