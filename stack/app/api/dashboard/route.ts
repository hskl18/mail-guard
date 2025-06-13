import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { DashboardData } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import {
  createSecurityResponse,
  logSecurityEvent,
  checkRateLimit,
} from "@/lib/api-security";

// GET /api/dashboard - Get dashboard data for a user (SECURED)
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require user authentication
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "DASHBOARD_UNAUTHORIZED",
        {
          url: request.url,
        },
        request
      );

      return createSecurityResponse("Authentication required", 401);
    }

    // SECURITY: Rate limiting
    if (!checkRateLimit(`user_${userId}`, 1000)) {
      // 1000 requests per hour for users
      logSecurityEvent(
        "DASHBOARD_RATE_LIMITED",
        {
          userId,
        },
        request
      );

      return createSecurityResponse(
        "Rate limit exceeded. Please try again later",
        429
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clerkId = searchParams.get("clerk_id");

    // SECURITY: Users can only access their own dashboard data
    const effectiveClerkId = clerkId || userId;
    if (effectiveClerkId !== userId) {
      logSecurityEvent(
        "DASHBOARD_UNAUTHORIZED_ACCESS",
        {
          userId,
          attemptedClerkId: effectiveClerkId,
        },
        request
      );

      return createSecurityResponse(
        "Cannot access dashboard data for different user",
        403
      );
    }

    // Get all devices for the user with IoT status
    const devicesRaw = await executeQuery<any[]>(
      `SELECT d.*, 
              ios.is_online, 
              ios.last_seen as iot_last_seen,
              ios.firmware_version,
              ios.battery_level,
              ios.signal_strength
       FROM devices d
       LEFT JOIN iot_device_status ios ON d.serial_number = ios.serial_number
       WHERE d.clerk_id=? 
       ORDER BY d.created_at DESC`,
      [effectiveClerkId]
    );

    // Convert database 0/1 values to proper booleans
    const devices = devicesRaw.map((device) => ({
      ...device,
      is_active: Boolean(device.is_active),
      is_online: Boolean(device.is_online),
      mail_delivered_notify: Boolean(device.mail_delivered_notify),
      mailbox_opened_notify: Boolean(device.mailbox_opened_notify),
      mail_removed_notify: Boolean(device.mail_removed_notify),
      email_notifications: Boolean(device.email_notifications),
      capture_image_on_open: Boolean(device.capture_image_on_open),
      capture_image_on_delivery: Boolean(device.capture_image_on_delivery),
    }));

    // Get device IDs for registered devices
    const deviceIds = devices.map((device) => device.id);

    // Get recent events from registered dashboard devices
    let recentEvents: any[] = [];
    if (deviceIds.length > 0) {
      // Fix: Use proper array handling for IN clause
      const placeholders = deviceIds.map(() => "?").join(",");
      recentEvents = await executeQuery<any[]>(
        `SELECT e.*, d.name as device_name, d.location as device_location
         FROM events e
         JOIN devices d ON e.device_id = d.id
         WHERE e.device_id IN (${placeholders}) 
         ORDER BY e.occurred_at DESC 
         LIMIT 10`,
        deviceIds
      );
    }

    // ALSO get IoT events from devices that match claimed serials by this user
    const userSerials = await executeQuery<any[]>(
      `SELECT DISTINCT serial_number FROM device_serials 
       WHERE claimed_by_clerk_id = ? OR 
             serial_number IN (SELECT serial_number FROM devices WHERE clerk_id = ?)`,
      [effectiveClerkId, effectiveClerkId]
    );

    // If user has claimed serials, get IoT events for those serials
    if (userSerials.length > 0) {
      const serialNumbers = userSerials.map((s) => s.serial_number);

      const serialPlaceholders = serialNumbers.map(() => "?").join(",");
      const iotEvents = await executeQuery<any[]>(
        `SELECT ie.*, 
                ds.device_model,
                'IoT Device' as device_name,
                CONCAT('Serial: ', ie.serial_number) as device_location
         FROM iot_events ie
         JOIN device_serials ds ON ie.serial_number = ds.serial_number
         WHERE ie.serial_number IN (${serialPlaceholders}) 
         ORDER BY ie.occurred_at DESC 
         LIMIT 10`,
        serialNumbers
      );

      // Transform IoT events to match dashboard events format
      const transformedIotEvents = iotEvents.map((event) => ({
        id: `iot_${event.id}`,
        device_id: `iot_${event.serial_number}`,
        event_type: event.event_type,
        occurred_at: event.occurred_at,
        device_name: event.device_name,
        device_location: event.device_location,
        serial_number: event.serial_number,
        source: "iot",
      }));

      // Combine and sort all events
      recentEvents = [...recentEvents, ...transformedIotEvents]
        .sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime()
        )
        .slice(0, 20); // Show more events since we're combining sources
    }

    // Get recent images from registered dashboard devices
    let recentImages: any[] = [];
    if (deviceIds.length > 0) {
      const placeholders = deviceIds.map(() => "?").join(",");
      recentImages = await executeQuery<any[]>(
        `SELECT i.*, d.name as device_name 
         FROM images i
         JOIN devices d ON i.device_id = d.id
         WHERE i.device_id IN (${placeholders}) 
         ORDER BY i.captured_at DESC 
         LIMIT 10`,
        deviceIds
      );
    }

    // ALSO get IoT images if user has claimed serials
    if (userSerials.length > 0) {
      const serialNumbers = userSerials.map((s) => s.serial_number);
      const serialPlaceholders = serialNumbers.map(() => "?").join(",");

      const iotImages = await executeQuery<any[]>(
        `SELECT ii.*, 
                'IoT Device' as device_name
         FROM iot_images ii
         WHERE ii.serial_number IN (${serialPlaceholders}) 
         ORDER BY ii.captured_at DESC 
         LIMIT 10`,
        serialNumbers
      );

      // Transform IoT images to match dashboard images format
      const transformedIotImages = iotImages.map((image) => ({
        id: `iot_${image.id}`,
        device_id: `iot_${image.serial_number}`,
        image_url: image.image_url,
        captured_at: image.captured_at,
        event_type: image.event_type,
        device_name: image.device_name,
        serial_number: image.serial_number,
        source: "iot",
      }));

      // Combine and sort all images
      recentImages = [...recentImages, ...transformedIotImages]
        .sort(
          (a, b) =>
            new Date(b.captured_at).getTime() -
            new Date(a.captured_at).getTime()
        )
        .slice(0, 15); // Show more images
    }

    // Get notification count
    const notificationResult = await executeQuery<any[]>(
      `SELECT COUNT(*) as count FROM notifications n
       JOIN devices d ON n.device_id = d.id
       WHERE d.clerk_id=?`,
      [effectiveClerkId]
    );

    const notificationCount = notificationResult[0]?.count || 0;

    const dashboardData: DashboardData = {
      devices,
      recent_events: recentEvents,
      recent_images: recentImages,
      notification_count: notificationCount,
    };

    logSecurityEvent(
      "DASHBOARD_DATA_RETRIEVED",
      {
        userId,
        deviceCount: devices.length,
        eventCount: recentEvents.length,
        imageCount: recentImages.length,
        notificationCount,
      },
      request
    );

    return NextResponse.json(dashboardData);
  } catch (error) {
    logSecurityEvent(
      "DASHBOARD_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
