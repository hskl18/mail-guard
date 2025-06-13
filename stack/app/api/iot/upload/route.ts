import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import {
  authenticateIoTDevice,
  createSecurityResponse,
  logSecurityEvent,
} from "@/lib/api-security";

// POST /api/iot/upload - Upload image from IoT device (SECURED)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate IoT device first
    const authResult = await authenticateIoTDevice(request);

    if (!authResult.success) {
      logSecurityEvent(
        "IOT_UPLOAD_AUTH_FAILED",
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

    // Check content type first
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      logSecurityEvent(
        "IOT_UPLOAD_INVALID_CONTENT_TYPE",
        {
          contentType,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse("Image file is required", 400);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const serialNumber = formData.get("serial_number") as string;
    const eventType = (formData.get("event_type") as string) || "delivery";
    const timestamp = formData.get("timestamp") as string;

    // SECURITY: Validate inputs
    if (!file) {
      return createSecurityResponse("Image file is required", 400);
    }

    if (!serialNumber) {
      return createSecurityResponse("Serial number is required", 400);
    }

    // SECURITY: Verify the authenticated device matches the serial number in payload
    if (authResult.deviceSerial && authResult.deviceSerial !== serialNumber) {
      logSecurityEvent(
        "IOT_UPLOAD_SERIAL_MISMATCH",
        {
          authenticatedSerial: authResult.deviceSerial,
          payloadSerial: serialNumber,
        },
        request
      );

      return createSecurityResponse("Device serial number mismatch", 403);
    }

    // Validate that image uploads are only for delivery events
    if (eventType !== "delivery" && eventType !== "mail_delivered") {
      return createSecurityResponse(
        "Image uploads are only supported for delivery events. Use event_type='delivery' for mail delivery photos",
        400
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      logSecurityEvent(
        "IOT_UPLOAD_INVALID_FILE_TYPE",
        {
          fileType: file.type,
          fileName: file.name,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse("File must be an image", 400);
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      logSecurityEvent(
        "IOT_UPLOAD_FILE_TOO_LARGE",
        {
          fileSize: file.size,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse("File size must be less than 10MB", 400);
    }

    // Check if device serial is valid (additional validation beyond API key)
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = 1",
      [serialNumber]
    );

    if (deviceSerial.length === 0) {
      logSecurityEvent(
        "IOT_UPLOAD_INVALID_SERIAL",
        {
          serial_number: serialNumber,
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      return createSecurityResponse(
        `Invalid device serial number: ${serialNumber}. Device not recognized`,
        404
      );
    }

    const serialInfo = deviceSerial[0];

    // Update device status
    await executeQuery(
      `UPDATE iot_device_status 
       SET last_seen = NOW(), is_online = 1
       WHERE serial_number = ?`,
      [serialNumber]
    );

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `iot-images/${serialNumber}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExtension}`;

    try {
      // Convert file to buffer for S3 upload
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // Upload to S3
      const s3Url = await uploadToS3(fileBuffer, fileName, file.type);

      // Check if device is claimed by a user (linked to dashboard)
      const dashboardDevice = await executeQuery<any[]>(
        "SELECT * FROM devices WHERE serial_number = ?",
        [serialNumber]
      );

      let imageRecord;
      const capturedAt = timestamp || new Date().toISOString();

      if (dashboardDevice.length > 0) {
        // Store in main images table if dashboard device exists
        const deviceId = dashboardDevice[0].id;
        const clerkId = dashboardDevice[0].clerk_id;

        // Create a new event for this image upload
        const eventResult = await executeQuery(
          `INSERT INTO events (device_id, event_type, clerk_id, occurred_at) 
           VALUES (?, ?, ?, NOW())`,
          [deviceId, eventType, clerkId]
        );

        const eventId = (eventResult as any).insertId;

        // Try inserting with event_id first, fallback without it if column doesn't exist
        try {
          imageRecord = await executeQuery(
            `INSERT INTO images (device_id, image_url, captured_at, event_id) 
             VALUES (?, ?, NOW(), ?)`,
            [deviceId, s3Url, eventId]
          );
        } catch (dbError: any) {
          // If event_id column doesn't exist, insert without it
          if (dbError.code === "ER_BAD_FIELD_ERROR") {
            console.log("event_id column not found, inserting without it");
            imageRecord = await executeQuery(
              `INSERT INTO images (device_id, image_url, captured_at) 
               VALUES (?, ?, NOW())`,
              [deviceId, s3Url]
            );
          } else {
            throw dbError;
          }
        }

        // Send email notification if user has email notifications enabled for this event type
        try {
          // Get device notification preferences
          const userDevice = await executeQuery<any[]>(
            `SELECT name, email_notifications, mail_delivered_notify, mailbox_opened_notify, mail_removed_notify 
             FROM devices WHERE id = ?`,
            [deviceId]
          );

          if (userDevice.length > 0) {
            const device = userDevice[0];
            const shouldSendEmail = device.email_notifications === 1;

            // Check if user wants notifications for delivery events (only type supported for image uploads)
            let shouldSendForEventType = false;
            if (
              (eventType === "delivery" || eventType === "mail_delivered") &&
              device.mail_delivered_notify === 1
            ) {
              shouldSendForEventType = true;
            }

            if (shouldSendEmail && shouldSendForEventType) {
              // Get user's email from Clerk
              const { clerkClient } = await import("@clerk/nextjs/server");
              const client = await clerkClient();
              const user = await client.users.getUser(clerkId);
              const userEmail = user.primaryEmailAddress?.emailAddress;

              if (userEmail) {
                const { sendEventNotification } = await import("@/lib/email");

                console.log(
                  `Sending email notification for ${eventType} event with image to ${userEmail}`
                );

                // Create image proxy URL for email
                const imageId = (imageRecord as any).insertId;
                const baseUrl =
                  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                const imageProxyUrl = `${baseUrl}/api/image/${imageId}`;

                const emailSent = await sendEventNotification({
                  to: userEmail,
                  deviceName: device.name || "Your Mailbox",
                  eventType: eventType,
                  timestamp: new Date().toISOString(),
                  deviceId: deviceId,
                  imageUrl: imageProxyUrl, // Use image proxy URL instead of direct S3
                });

                if (emailSent) {
                  console.log(
                    `Email notification sent successfully for device ${deviceId} with image`
                  );
                }
              }
            }
          }
        } catch (emailError) {
          // Log but don't fail the upload if email sending fails
          console.error("Email notification error:", emailError);
        }

        // Log successful upload
        logSecurityEvent(
          "IOT_IMAGE_UPLOADED",
          {
            serial_number: serialNumber,
            device_id: deviceId,
            event_type: eventType,
            file_size: file.size,
            s3_url: s3Url,
          },
          request
        );

        return NextResponse.json(
          {
            message: "Image uploaded successfully",
            image_id: (imageRecord as any).insertId,
            image_url: s3Url,
            device_id: deviceId,
            event_id: eventId,
            serial_number: serialNumber,
            file_size: file.size,
            captured_at: capturedAt,
          },
          { status: 201 }
        );
      } else {
        // Store in IoT-specific images table (already created in init-db)
        imageRecord = await executeQuery(
          `INSERT INTO iot_images (serial_number, image_url, event_type, captured_at, file_size) 
           VALUES (?, ?, ?, NOW(), ?)`,
          [serialNumber, s3Url, eventType, file.size]
        );

        // Log unclaimed device upload
        logSecurityEvent(
          "IOT_UNCLAIMED_IMAGE_UPLOADED",
          {
            serial_number: serialNumber,
            event_type: eventType,
            file_size: file.size,
            is_claimed: serialInfo.is_claimed,
          },
          request
        );

        return NextResponse.json(
          {
            message:
              "IoT image uploaded successfully (no dashboard device linked)",
            iot_image_id: (imageRecord as any).insertId,
            image_url: s3Url,
            serial_number: serialNumber,
            event_type: eventType,
            file_size: file.size,
            captured_at: capturedAt,
            note: "Link device to dashboard for full integration",
          },
          { status: 201 }
        );
      }
    } catch (s3Error) {
      logSecurityEvent(
        "IOT_UPLOAD_S3_ERROR",
        {
          error: s3Error instanceof Error ? s3Error.message : "S3 error",
          deviceSerial: authResult.deviceSerial,
        },
        request
      );

      console.error("S3 upload error:", s3Error);
      return NextResponse.json(
        {
          error: "Failed to upload image to storage",
          message: s3Error instanceof Error ? s3Error.message : "Storage error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logSecurityEvent(
      "IOT_UPLOAD_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("IoT upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to process image upload",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/iot/upload?serial_number=XXX - Get recent images for IoT device (SECURED)
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Authenticate IoT device first
    const authResult = await authenticateIoTDevice(request);

    if (!authResult.success) {
      logSecurityEvent(
        "IOT_UPLOAD_GET_AUTH_FAILED",
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
    const eventType = searchParams.get("event_type");

    if (!serialNumber) {
      return createSecurityResponse("Serial number parameter is required", 400);
    }

    // SECURITY: Verify the authenticated device matches the requested serial number
    if (authResult.deviceSerial && authResult.deviceSerial !== serialNumber) {
      logSecurityEvent(
        "IOT_UPLOAD_GET_SERIAL_MISMATCH",
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
      return createSecurityResponse("Device not found", 404);
    }

    // Simplified - get IoT-specific images only
    let iotQuery = `
      SELECT * FROM iot_images 
      WHERE serial_number = ?
    `;

    if (eventType) {
      iotQuery += ` AND event_type = '${eventType}'`;
    }

    iotQuery += ` ORDER BY captured_at DESC LIMIT ${limit}`;

    const iotImages = await executeQuery<any[]>(iotQuery, [serialNumber]);

    logSecurityEvent(
      "IOT_IMAGES_RETRIEVED",
      {
        serial_number: serialNumber,
        image_count: iotImages.length,
        event_type: eventType,
        limit,
      },
      request
    );

    return NextResponse.json({
      serial_number: serialNumber,
      is_claimed: deviceSerial[0].is_claimed,
      device_model: deviceSerial[0].device_model,
      iot_images: iotImages,
      total_images: iotImages.length,
      filters: {
        event_type: eventType,
        limit: limit,
      },
    });
  } catch (error) {
    logSecurityEvent(
      "IOT_UPLOAD_GET_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      request
    );

    console.error("IoT get images error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve images",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
