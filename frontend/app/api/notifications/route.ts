import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Notification, NotificationPayload } from "@/lib/types";

// GET /api/notifications - Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerk_id");
    const deviceId = searchParams.get("device_id");
    const isRead = searchParams.get("is_read");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = `
      SELECT n.*, d.name as device_name, d.clerk_id 
      FROM notifications n 
      LEFT JOIN devices d ON n.device_id = d.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (clerkId) {
      query += " AND d.clerk_id = ?";
      params.push(clerkId);
    }

    if (deviceId) {
      query += " AND n.device_id = ?";
      params.push(deviceId);
    }

    if (isRead !== null) {
      query += " AND n.is_read = ?";
      params.push(isRead === "true");
    }

    query += " ORDER BY n.sent_at DESC LIMIT ?";
    params.push(limit);

    const notifications = await executeQuery<any[]>(query, params);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_id, clerk_id, notification_type, message } = body;

    if (!device_id || !notification_type) {
      return NextResponse.json(
        { error: "Missing required fields: device_id, notification_type" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO notifications (device_id, notification_type, message) 
       VALUES (?, ?, ?)`,
      [device_id, notification_type, message || null]
    );

    const insertResult = result as any;
    const newNotification = await executeQuery<any[]>(
      `SELECT n.*, d.name as device_name 
       FROM notifications n 
       LEFT JOIN devices d ON n.device_id = d.id 
       WHERE n.id = ?`,
      [insertResult.insertId]
    );

    return NextResponse.json(
      {
        message: "Notification created successfully",
        notification: newNotification[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
