import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { sendEventNotification } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";
import {
  authenticateIoTDevice,
  validateIoTEventPayload,
  createSecurityResponse,
  logSecurityEvent,
} from "@/lib/api-security";

// POST /api/iot/event - Push event from IoT device (SECURED)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate IoT device first
    const authResult = await authenticateIoTDevice(request);

    if (!authResult.success) {
      logSecurityEvent(
        "IOT_AUTH_FAILED",
        {
          error: authResult.error,
          url: request.url,
        },
        request
      );

      return createSecurityResponse(
        authResult.error || "Authentication failed",
        authResult.statusCode || 401
      );
    }

    const body = await request.json();

    // SECURITY: Validate request payload
    const validation = validateIoTEventPayload(body);
    if (!validation.valid) {
      logSecurityEvent(
        "IOT_INVALID_PAYLOAD",
        {
          errors: validation.errors,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse(
        `Invalid request: ${validation.errors.join(", ")}`,
        400
      );
    }

    const {
      serial_number,
      event_data,
      timestamp,
      firmware_version,
      battery_level,
      signal_strength,
    } = body;

    // SECURITY: Verify the authenticated device matches the serial number in payload
    if (authResult.deviceSerial && authResult.deviceSerial !== serial_number) {
      logSecurityEvent(
        "IOT_SERIAL_MISMATCH",
        {
          authenticatedSerial: authResult.deviceSerial,
          payloadSerial: serial_number,
        },
        request
      );

      return createSecurityResponse("Device serial number mismatch", 403);
    }

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
    const {
      reed_sensor,
      event_type,
      mailbox_status,
      weight_sensor,
      weight_value,
      weight_threshold,
    } = event_data;

    if (reed_sensor === undefined) {
      return NextResponse.json(
        { error: "reed_sensor status is required in event_data" },
        { status: 400 }
      );
    }

    // Check if device serial is valid (additional validation beyond API key)
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = 1",
      [serial_number]
    );

    if (deviceSerial.length === 0) {
      logSecurityEvent(
        "IOT_INVALID_SERIAL",
        {
          serial_number,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

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

    // Log successful authentication and event processing
    logSecurityEvent(
      "IOT_EVENT_RECEIVED",
      {
        serial_number,
        event_type: event_type || "inferred",
        has_weight_data: weight_value !== undefined,
        battery_level,
        signal_strength,
      },
      request
    );

    // Get last weight reading for comparison (if weight sensor data provided)
    let lastWeightReading = null;
    let weightChange = null;
    let itemDetected = false;

    if (weight_sensor !== undefined || weight_value !== undefined) {
      try {
        const lastWeight = await executeQuery<any[]>(
          `SELECT weight_value FROM iot_device_status 
           WHERE serial_number = ? AND weight_value IS NOT NULL 
           ORDER BY last_seen DESC LIMIT 1`,
          [serial_number]
        );

        if (lastWeight.length > 0) {
          lastWeightReading = lastWeight[0].weight_value;
          if (weight_value !== undefined && lastWeightReading !== null) {
            weightChange = weight_value - lastWeightReading;

            // Item detection logic
            const threshold = weight_threshold || 50; // Default 50g threshold
            if (Math.abs(weightChange) >= threshold) {
              itemDetected = true;
            }
          }
        }
      } catch (weightError: any) {
        // If weight_value column doesn't exist, skip weight comparison
        if (
          weightError.code === "ER_BAD_FIELD_ERROR" ||
          weightError.message?.includes("weight_value")
        ) {
          console.log(
            "Weight sensor data requested but weight_value column not available"
          );
        } else {
          console.log("Weight comparison error:", weightError);
        }
      }
    }

    // Update or create device status
    const existingStatus = await executeQuery<any[]>(
      "SELECT * FROM iot_device_status WHERE serial_number = ?",
      [serial_number]
    );

    if (existingStatus.length > 0) {
      // Update existing status - skip weight_value column for now
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
      // Create new status record - skip weight_value column for now
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

    // Enhanced event type mapping with weight sensor integration
    let standardEventType = "unknown";
    let detectionMethod = "reed_sensor";

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
          detectionMethod = event_type.toLowerCase().includes("delivery")
            ? "explicit"
            : "reed_sensor";
          break;
        case "removal":
        case "mail_removed":
          standardEventType = "removal";
          detectionMethod = event_type.toLowerCase().includes("removal")
            ? "explicit"
            : "reed_sensor";
          break;
        case "item_detected":
        case "weight_change":
          standardEventType = "delivery"; // Weight-based item detection maps to delivery
          detectionMethod = "weight_sensor";
          break;
        default:
          standardEventType = reed_sensor ? "open" : "close";
      }
    } else {
      // Enhanced inference logic with weight sensor
      if (itemDetected && weightChange !== null) {
        if (weightChange > 0) {
          standardEventType = "delivery";
          detectionMethod = "weight_sensor";
        } else if (weightChange < 0) {
          standardEventType = "removal";
          detectionMethod = "weight_sensor";
        }
      } else {
        // Fallback to reed sensor
        standardEventType = reed_sensor ? "open" : "close";
        detectionMethod = "reed_sensor";
      }
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

      // Store enhanced health data with weight information
      if (
        battery_level !== undefined ||
        signal_strength !== undefined ||
        weight_value !== undefined
      ) {
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

      // Log successful event processing
      logSecurityEvent(
        "IOT_EVENT_PROCESSED",
        {
          serial_number,
          event_type: standardEventType,
          device_id: deviceId,
          detection_method: detectionMethod,
          has_notification:
            standardEventType === "open" ||
            standardEventType === "delivery" ||
            standardEventType === "removal",
        },
        request
      );

      return NextResponse.json({
        message: "Event recorded successfully",
        event_id: (eventResult as any).insertId,
        event_type: standardEventType,
        detection_method: detectionMethod,
        device_id: deviceId,
        serial_number: serial_number,
        status: "claimed_device",
        weight_data:
          weight_value !== undefined
            ? {
                current_weight: weight_value,
                last_weight: lastWeightReading,
                weight_change: weightChange,
                item_detected: itemDetected,
                threshold_used: weight_threshold || 50,
              }
            : null,
        processed_at: new Date().toISOString(),
      });
    } else {
      // Store in IoT events table if device is not claimed or not linked
      // Enhanced event data with weight information
      const enhancedEventData = {
        ...event_data,
        detection_method: detectionMethod,
        weight_data:
          weight_value !== undefined
            ? {
                current_weight: weight_value,
                last_weight: lastWeightReading,
                weight_change: weightChange,
                item_detected: itemDetected,
                threshold_used: weight_threshold || 50,
              }
            : null,
      };

      const iotEventResult = await executeQuery(
        `INSERT INTO iot_events (serial_number, event_type, event_data, occurred_at) 
         VALUES (?, ?, ?, NOW())`,
        [serial_number, standardEventType, JSON.stringify(enhancedEventData)]
      );

      // Log unclaimed device event
      logSecurityEvent(
        "IOT_UNCLAIMED_EVENT",
        {
          serial_number,
          event_type: standardEventType,
          is_claimed: serialInfo.is_claimed,
          detection_method: detectionMethod,
        },
        request
      );

      return NextResponse.json({
        message: "IoT event recorded (unclaimed device)",
        iot_event_id: (iotEventResult as any).insertId,
        event_type: standardEventType,
        detection_method: detectionMethod,
        serial_number: serial_number,
        status: serialInfo.is_claimed ? "claimed_but_not_linked" : "unclaimed",
        note: "Claim device in dashboard for full integration",
        weight_data:
          weight_value !== undefined
            ? {
                current_weight: weight_value,
                last_weight: lastWeightReading,
                weight_change: weightChange,
                item_detected: itemDetected,
                threshold_used: weight_threshold || 50,
              }
            : null,
        processed_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    logSecurityEvent(
      "IOT_EVENT_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

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

// GET /api/iot/event?serial_number=XXX - Get recent events for IoT device (SECURED)
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Authenticate IoT device first
    const authResult = await authenticateIoTDevice(request);

    if (!authResult.success) {
      logSecurityEvent(
        "IOT_GET_AUTH_FAILED",
        {
          error: authResult.error,
          url: request.url,
        },
        request
      );

      return createSecurityResponse(
        authResult.error || "Authentication failed",
        authResult.statusCode || 401
      );
    }

    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serial_number");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!serialNumber) {
      return NextResponse.json(
        { error: "Serial number parameter is required" },
        { status: 400 }
      );
    }

    // SECURITY: Verify the authenticated device matches the requested serial number
    if (authResult.deviceSerial && authResult.deviceSerial !== serialNumber) {
      logSecurityEvent(
        "IOT_GET_SERIAL_MISMATCH",
        {
          authenticatedSerial: authResult.deviceSerial,
          requestedSerial: serialNumber,
        },
        request
      );

      return createSecurityResponse(
        "Cannot access data for different device",
        403
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

    logSecurityEvent(
      "IOT_EVENTS_RETRIEVED",
      {
        serial_number: serialNumber,
        event_count: iotEvents.length,
        limit,
      },
      request
    );

    return NextResponse.json({
      serial_number: serialNumber,
      is_claimed: deviceSerial[0].is_claimed,
      device_model: deviceSerial[0].device_model,
      iot_events: iotEvents,
      total_events: iotEvents.length,
    });
  } catch (error) {
    logSecurityEvent(
      "IOT_GET_EVENTS_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      request
    );

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
