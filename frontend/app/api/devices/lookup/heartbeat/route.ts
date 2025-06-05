import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// POST /api/devices/lookup/heartbeat?name=devicename - Send heartbeat by device name
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get("name");
    const body = await request.json();
    const { clerk_id } = body;

    if (!deviceName || !clerk_id) {
      return NextResponse.json(
        { error: "Missing required parameters: name and clerk_id" },
        { status: 400 }
      );
    }

    // Check if device exists and belongs to user
    const devices = await executeQuery<any[]>(
      "SELECT id FROM devices WHERE name = ? AND clerk_id = ?",
      [deviceName, clerk_id]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const deviceId = devices[0].id;

    // Update last_seen timestamp
    await executeQuery("UPDATE devices SET last_seen = NOW() WHERE id = ?", [
      deviceId,
    ]);

    return NextResponse.json({
      message: "Heartbeat received successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing heartbeat by name:", error);
    return NextResponse.json(
      { error: "Failed to process heartbeat" },
      { status: 500 }
    );
  }
}
