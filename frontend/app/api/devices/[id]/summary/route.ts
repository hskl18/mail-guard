import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { Device, DeviceSummary } from "@/lib/types";

// GET /api/devices/[id]/summary - Get device summary with recent activity
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

    // Get device details
    const devices = await executeQuery<Device[]>(
      "SELECT * FROM devices WHERE id=? AND clerk_id=?",
      [deviceId, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    const device = devices[0];

    // Get latest event
    const latestEvents = await executeQuery<any[]>(
      `SELECT * FROM events 
       WHERE device_id=? 
       ORDER BY occurred_at DESC 
       LIMIT 1`,
      [deviceId]
    );

    // Get latest image
    const latestImages = await executeQuery<any[]>(
      `SELECT * FROM images 
       WHERE device_id=? 
       ORDER BY captured_at DESC 
       LIMIT 1`,
      [deviceId]
    );

    // Get notification count
    const notificationCount = await executeQuery<any[]>(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE device_id=? AND clerk_id=?`,
      [deviceId, clerkId]
    );

    // Get recent events (last 10)
    const recentEvents = await executeQuery<any[]>(
      `SELECT * FROM events 
       WHERE device_id=? 
       ORDER BY occurred_at DESC 
       LIMIT 10`,
      [deviceId]
    );

    const summary: DeviceSummary = {
      device,
      latest_event: latestEvents[0] || null,
      latest_image: latestImages[0] || null,
      notification_count: notificationCount[0]?.count || 0,
      recent_events: recentEvents,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching device summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch device summary" },
      { status: 500 }
    );
  }
}
