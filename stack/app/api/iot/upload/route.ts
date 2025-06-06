import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";

// POST /api/iot/upload - Upload image from IoT device
export async function POST(request: NextRequest) {
  try {
    // Check content type first
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const serialNumber = formData.get("serial_number") as string;
    const eventType = (formData.get("event_type") as string) || "general";
    const timestamp = formData.get("timestamp") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!serialNumber) {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Check if device serial is valid
    const deviceSerial = await executeQuery<any[]>(
      "SELECT * FROM device_serials WHERE serial_number = ? AND is_valid = 1",
      [serialNumber]
    );

    if (deviceSerial.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid device serial number",
          serial_number: serialNumber,
          action: "Device not recognized",
        },
        { status: 404 }
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

        // Find related event if exists (within last 5 minutes)
        const recentEvent = await executeQuery<any[]>(
          `SELECT id FROM events 
           WHERE device_id = ? AND event_type = ? 
           AND occurred_at >= NOW() - INTERVAL 5 MINUTE
           ORDER BY occurred_at DESC LIMIT 1`,
          [deviceId, eventType]
        );

        const eventId = recentEvent.length > 0 ? recentEvent[0].id : null;

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

// GET /api/iot/upload?serial_number=XXX - Get recent images for IoT device
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serial_number");
    const limit = parseInt(searchParams.get("limit") || "20");
    const eventType = searchParams.get("event_type");

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
