import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { DeviceStatusPayload } from "@/lib/types";

// PUT /api/devices/[id]/status - Update device status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const deviceId = parseInt(resolvedParams.id);

  try {
    const body: DeviceStatusPayload = await request.json();

    if (!body.clerk_id) {
      return NextResponse.json(
        { error: "clerk_id is required" },
        { status: 400 }
      );
    }

    const result = await executeQuery<any>(
      `UPDATE devices SET 
        is_active=?,
        last_seen=NOW() 
      WHERE id=? AND clerk_id=?`,
      [body.is_active, deviceId, body.clerk_id]
    );

    // Check if device was found and updated
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ id: deviceId });
  } catch (error) {
    console.error("Error updating device status:", error);
    return NextResponse.json(
      { error: "Failed to update device status" },
      { status: 500 }
    );
  }
}
