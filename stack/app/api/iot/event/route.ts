import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { sendEventNotification } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";

// POST /api/iot/event - Push event from IoT device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serial_number,
      event_data,
      timestamp,
      firmware_version,
      battery_level,
      signal_strength,
    } = body;

    if (!serial_number) {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      );
    }

    if (!event_data) {
      return NextResponse.json(
        { error: "Event data is required" },
        { status: 400 }
      );
    }

    // Validate event data structure
    const { reed_sensor, event_type, mailbox_status } = event_data;

    if (reed_sensor === undefined) {
      return NextResponse.json(
        { error: "reed_sensor status is required in event_data" },
        { status: 400 }
      );
    }

    // Check if device serial is valid
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = 1",
      [serial_number]
    );

    if (deviceSerial.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid device serial number",
          serial_number: serial_number,
          action: "Device not recognized",
        },
        { status: 404 }
      );
    }

    const serialInfo = deviceSerial[0];

    // Update or create device status
    const existingStatus = await executeQuery<any[]>(
      "SELECT * FROM iot_device_status WHERE serial_number = ?",
      [serial_number]
    );

    if (existingStatus.length > 0) {
      // Update existing status
      await executeQuery(
        `UPDATE iot_device_status 
         SET last_seen = NOW(), 
             firmware_version = ?,
             battery_level = ?,
             signal_strength = ?,
             is_online = 1
         WHERE serial_number = ?`,
        [
          firmware_version || existingStatus[0].firmware_version || "1.0.0",
          battery_level ?? null,
          signal_strength ?? null,
          serial_number,
        ]
      );
    } else {
      // Create new status record
      await executeQuery(
        `INSERT INTO iot_device_status 
         (serial_number, firmware_version, battery_level, signal_strength, is_online, last_seen) 
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [
          serial_number,
          firmware_version || "1.0.0",
          battery_level ?? null,
          signal_strength ?? null,
        ]
      );
    }

    // Map reed sensor and event type to standardized event
    let standardEventType = "unknown";

    if (event_type) {
      // Use provided event type if available
      switch (event_type.toLowerCase()) {
        case "open":
        case "opened":
          standardEventType = "open";
          break;
        case "close":
        case "closed":
          standardEventType = "close";
          break;
        case "delivery":
        case "mail_delivered":
          standardEventType = "delivery";
          break;
        case "removal":
        case "mail_removed":
          standardEventType = "removal";
          break;
        default:
          standardEventType = reed_sensor ? "open" : "close";
      }
    } else {
      // Infer from reed sensor status
      standardEventType = reed_sensor ? "open" : "close";
    }

    // Check if device is claimed by a user (linked to dashboard)
    const dashboardDevice = await executeQuery<any[]>(
      "SELECT * FROM devices WHERE serial_number = ?",
      [serial_number]
    );

    let deviceId = null;
    let clerkId = serialInfo.claimed_by_clerk_id;

    if (dashboardDevice.length > 0) {
      deviceId = dashboardDevice[0].id;
      clerkId = dashboardDevice[0].clerk_id;
    }

    if (deviceId && clerkId) {
      // Store in events table if device is claimed and linked to dashboard
      const eventResult = await executeQuery(
        `INSERT INTO events (device_id, event_type, clerk_id, occurred_at) 
         VALUES (?, ?, ?, NOW())`,
        [deviceId, standardEventType, clerkId]
      );

      // Store health data if provided
      if (battery_level !== undefined || signal_strength !== undefined) {
        await executeQuery(
          `INSERT INTO device_health (device_id, clerk_id, battery_level, signal_strength, firmware_version, reported_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            deviceId,
            clerkId,
            battery_level ?? null,
            signal_strength ?? null,
            firmware_version ?? null,
          ]
        );
      }

      // Create notification if needed (for important events)
      if (
        standardEventType === "open" ||
        standardEventType === "delivery" ||
        standardEventType === "removal"
      ) {
        try {
          // Use simpler notification creation without message column for now
          await executeQuery(
            `INSERT INTO notifications (device_id, notification_type, sent_at)
             VALUES (?, ?, NOW())`,
            [deviceId, `mailbox_${standardEventType}`]
          );
        } catch (notificationError) {
          // Log but don't fail the event if notification creation fails
          console.log("Notification creation failed:", notificationError);
        }
      }

      // Send email notification if user has email notifications enabled
      try {
        // Get device notification preferences (without email)
        const userDevice = await executeQuery<any[]>(
          `SELECT name, email_notifications, mail_delivered_notify, mailbox_opened_notify, mail_removed_notify 
           FROM devices WHERE id = ?`,
          [deviceId]
        );

        if (userDevice.length > 0) {
          const device = userDevice[0];
          const shouldSendEmail = device.email_notifications === 1;

          // Check if user wants notifications for this specific event type
          let shouldSendForEventType = false;
          if (
            standardEventType === "delivery" &&
            device.mail_delivered_notify === 1
          ) {
            shouldSendForEventType = true;
          } else if (
            standardEventType === "open" &&
            device.mailbox_opened_notify === 1
          ) {
            shouldSendForEventType = true;
          } else if (
            standardEventType === "removal" &&
            device.mail_removed_notify === 1
          ) {
            shouldSendForEventType = true;
          }

          if (shouldSendEmail && shouldSendForEventType) {
            // Get user's email from Clerk using clerk_id
            try {
              const client = await clerkClient();
              const user = await client.users.getUser(clerkId);
              const userEmail = user.primaryEmailAddress?.emailAddress;

              if (userEmail) {
                console.log(
                  `Sending email notification for ${standardEventType} event to ${userEmail} (clerk_id: ${clerkId})`
                );

                const emailSent = await sendEventNotification({
                  to: userEmail,
                  deviceName: device.name || "Your Mailbox",
                  eventType: standardEventType,
                  timestamp: new Date().toISOString(),
                  deviceId: deviceId,
                });

                if (emailSent) {
                  console.log(
                    `Email notification sent successfully for device ${deviceId} to user ${clerkId}`
                  );
                } else {
                  console.log(
                    `Failed to send email notification for device ${deviceId}`
                  );
                }
              } else {
                console.log(
                  `No email address found for user ${clerkId} - skipping email notification`
                );
              }
            } catch (clerkError) {
              console.error(
                `Error getting user from Clerk (${clerkId}):`,
                clerkError
              );
            }
          } else {
            console.log(
              `Email notification skipped for device ${deviceId}: email_notifications=${device.email_notifications}, event_notify=${shouldSendForEventType}`
            );
          }
        }
      } catch (emailError) {
        // Log but don't fail the event if email sending fails
        console.error("Email notification error:", emailError);
      }

      return NextResponse.json({
        message: "Event recorded successfully",
        event_id: (eventResult as any).insertId,
        event_type: standardEventType,
        device_id: deviceId,
        serial_number: serial_number,
        status: "claimed_device",
        processed_at: new Date().toISOString(),
      });
    } else {
      // Store in IoT events table if device is not claimed or not linked
      const iotEventResult = await executeQuery(
        `INSERT INTO iot_events (serial_number, event_type, event_data, occurred_at) 
         VALUES (?, ?, ?, NOW())`,
        [serial_number, standardEventType, JSON.stringify(event_data)]
      );

      return NextResponse.json({
        message: "IoT event recorded (unclaimed device)",
        iot_event_id: (iotEventResult as any).insertId,
        event_type: standardEventType,
        serial_number: serial_number,
        status: serialInfo.is_claimed ? "claimed_but_not_linked" : "unclaimed",
        note: "Claim device in dashboard for full integration",
        processed_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("IoT event error:", error);
    return NextResponse.json(
      {
        error: "Failed to process event",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/iot/event?serial_number=XXX - Get recent events for IoT device
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serial_number");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!serialNumber) {
      return NextResponse.json(
        { error: "Serial number parameter is required" },
        { status: 400 }
      );
    }

    // Check if device serial exists
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ?",
      [serialNumber]
    );

    if (deviceSerial.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Simplified - get IoT-specific events only
    const iotEvents = await executeQuery<any[]>(
      `SELECT * FROM iot_events 
       WHERE serial_number = ? 
       ORDER BY occurred_at DESC 
       LIMIT ${limit}`,
      [serialNumber]
    );

    return NextResponse.json({
      serial_number: serialNumber,
      is_claimed: deviceSerial[0].is_claimed,
      device_model: deviceSerial[0].device_model,
      iot_events: iotEvents,
      total_events: iotEvents.length,
    });
  } catch (error) {
    console.error("IoT get events error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve events",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
