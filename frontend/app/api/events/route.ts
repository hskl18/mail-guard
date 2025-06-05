import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import type { MailboxEvent, MailboxEventPayload } from "@/lib/types";

// GET /api/events - Get events for a device/user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");
    const clerkId = searchParams.get("clerk_id");
    const eventType = searchParams.get("event_type");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = `
      SELECT e.*, d.name as device_name 
      FROM events e 
      LEFT JOIN devices d ON e.device_id = d.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (deviceId) {
      query += " AND e.device_id = ?";
      params.push(deviceId);
    }

    if (clerkId) {
      query += " AND e.clerk_id = ?";
      params.push(clerkId);
    }

    if (eventType) {
      query += " AND e.event_type = ?";
      params.push(eventType);
    }

    query += " ORDER BY e.occurred_at DESC LIMIT ?";
    params.push(limit);

    const events = await executeQuery<any[]>(query, params);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_id, event_type, clerk_id, timestamp } = body;

    if (!device_id || !event_type) {
      return NextResponse.json(
        { error: "Missing required fields: device_id, event_type" },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ["open", "close", "delivery", "removal"];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        {
          error:
            "Invalid event_type. Must be one of: " + validEventTypes.join(", "),
        },
        { status: 400 }
      );
    }

    const occurredAt = timestamp ? new Date(timestamp) : new Date();

    const result = await executeQuery(
      `INSERT INTO events (device_id, event_type, clerk_id, occurred_at) 
       VALUES (?, ?, ?, ?)`,
      [device_id, event_type, clerk_id || null, occurredAt]
    );

    const insertResult = result as any;
    const newEvent = await executeQuery<any[]>(
      `SELECT e.*, d.name as device_name 
       FROM events e 
       LEFT JOIN devices d ON e.device_id = d.id 
       WHERE e.id = ?`,
      [insertResult.insertId]
    );

    return NextResponse.json(
      {
        message: "Event created successfully",
        event: newEvent[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
