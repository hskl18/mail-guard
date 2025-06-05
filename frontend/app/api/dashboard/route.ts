import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { DashboardData } from "@/lib/types";

// GET /api/dashboard - Get dashboard data for a user
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clerkId = searchParams.get("clerk_id");

  if (!clerkId) {
    return NextResponse.json(
      { error: "clerk_id parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Get all devices for the user
    const devices = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE clerk_id=? ORDER BY created_at DESC",
      [clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json({
        devices: [],
        recent_events: [],
        recent_images: [],
        notification_count: 0,
      });
    }

    // Get device IDs
    const deviceIds = devices.map((device) => device.id);

    // Get recent events
    const recentEvents = await executeQuery<any[]>(
      `SELECT * FROM mailbox_events 
       WHERE device_id IN (?) 
       ORDER BY occurred_at DESC 
       LIMIT 10`,
      [deviceIds]
    );

    // Get recent images
    const recentImages = await executeQuery<any[]>(
      `SELECT * FROM images 
       WHERE device_id IN (?) 
       ORDER BY captured_at DESC 
       LIMIT 10`,
      [deviceIds]
    );

    // Get notification count
    const notificationResult = await executeQuery<any[]>(
      `SELECT COUNT(*) as count FROM notifications n
       JOIN devices d ON n.device_id = d.id
       WHERE d.clerk_id=?`,
      [clerkId]
    );

    const notificationCount = notificationResult[0]?.count || 0;

    const dashboardData: DashboardData = {
      devices,
      recent_events: recentEvents,
      recent_images: recentImages,
      notification_count: notificationCount,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
