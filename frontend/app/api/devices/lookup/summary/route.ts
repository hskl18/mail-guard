import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET /api/devices/lookup/summary?name=devicename&clerk_id=user_id - Get device summary by name
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

    // Check if device exists and belongs to user
    const devices = await executeQuery<any[]>(
      "SELECT id, name, location, is_active, last_seen, created_at FROM devices WHERE name = ? AND clerk_id = ?",
      [deviceName, clerkId]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const device = devices[0];
    const deviceId = device.id;

    // Get event counts
    const eventCounts = await executeQuery<any[]>(
      `SELECT 
         event_type,
         COUNT(*) as count,
         MAX(occurred_at) as last_occurrence
       FROM events 
       WHERE device_id = ? 
       GROUP BY event_type`,
      [deviceId]
    );

    // Get recent events (last 10)
    const recentEvents = await executeQuery<any[]>(
      `SELECT event_type, occurred_at 
       FROM events 
       WHERE device_id = ? 
       ORDER BY occurred_at DESC 
       LIMIT 10`,
      [deviceId]
    );

    // Get total event count
    const totalEvents = await executeQuery<any[]>(
      "SELECT COUNT(*) as total FROM events WHERE device_id = ?",
      [deviceId]
    );

    // Get latest health data
    const latestHealth = await executeQuery<any[]>(
      `SELECT battery_level, signal_strength, temperature, firmware_version, reported_at
       FROM device_health 
       WHERE device_id = ? 
       ORDER BY reported_at DESC 
       LIMIT 1`,
      [deviceId]
    );

    const summary = {
      device: {
        name: device.name,
        location: device.location,
        is_active: device.is_active,
        last_seen: device.last_seen,
        created_at: device.created_at,
      },
      statistics: {
        total_events: totalEvents[0]?.total || 0,
        event_breakdown: eventCounts.reduce((acc: any, item: any) => {
          acc[item.event_type] = {
            count: item.count,
            last_occurrence: item.last_occurrence,
          };
          return acc;
        }, {}),
      },
      recent_events: recentEvents,
      health: latestHealth[0] || null,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching device summary by name:", error);
    return NextResponse.json(
      { error: "Failed to fetch device summary" },
      { status: 500 }
    );
  }
}
