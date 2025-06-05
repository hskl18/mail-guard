import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";

// POST /api/iot/upload - Upload image from IoT device
export async function POST(request: NextRequest) {
  try {
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

    // Check if IoT device exists and is activated
    const iotDevice = await executeQuery<any[]>(
      "SELECT * FROM iot_devices WHERE serial_number = ? AND is_activated = TRUE",
      [serialNumber]
    );

    if (iotDevice.length === 0) {
      return NextResponse.json(
        {
          error: "Device not found or not activated",
          serial_number: serialNumber,
          action: "Please activate device first",
        },
        { status: 404 }
      );
    }

    const device = iotDevice[0];

    // Update device last seen
    await executeQuery(
      "UPDATE iot_devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?",
      [device.id]
    );

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `iot-images/${serialNumber}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExtension}`;

    try {
      // Upload to S3
      const s3Url = await uploadToS3(file, fileName);

      // Check if we have a linked dashboard device
      const dashboardDevice = await executeQuery<any[]>(
        "SELECT * FROM devices WHERE iot_device_id = ? OR serial_number = ?",
        [device.id, serialNumber]
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
           AND occurred_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           ORDER BY occurred_at DESC LIMIT 1`,
          [deviceId, eventType]
        );

        const eventId = recentEvent.length > 0 ? recentEvent[0].id : null;

        imageRecord = await executeQuery(
          `INSERT INTO images (device_id, image_url, captured_at, event_id) 
           VALUES (?, ?, ?, ?)`,
          [deviceId, s3Url, capturedAt, eventId]
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
        // Store in IoT-specific images table
        await executeQuery(
          `CREATE TABLE IF NOT EXISTS iot_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            iot_device_id INT NOT NULL,
            serial_number VARCHAR(255) NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            event_type VARCHAR(50),
            captured_at DATETIME,
            file_size INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_iot_device_id (iot_device_id),
            INDEX idx_serial_number (serial_number),
            INDEX idx_captured_at (captured_at),
            FOREIGN KEY (iot_device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
          )`
        );

        imageRecord = await executeQuery(
          `INSERT INTO iot_images (iot_device_id, serial_number, image_url, event_type, captured_at, file_size) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [device.id, serialNumber, s3Url, eventType, capturedAt, file.size]
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

    // Check if device exists
    const iotDevice = await executeQuery<any[]>(
      "SELECT * FROM iot_devices WHERE serial_number = ?",
      [serialNumber]
    );

    if (iotDevice.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Try to get images from main images table first
    let dashboardQuery = `
      SELECT i.*, d.name as device_name, e.event_type as related_event
      FROM images i 
      LEFT JOIN devices d ON i.device_id = d.id 
      LEFT JOIN events e ON i.event_id = e.id
      WHERE d.serial_number = ? OR d.iot_device_id = ?
    `;
    const dashboardParams = [serialNumber, iotDevice[0].id];

    if (eventType) {
      dashboardQuery += " AND e.event_type = ?";
      dashboardParams.push(eventType);
    }

    dashboardQuery += " ORDER BY i.captured_at DESC LIMIT ?";
    dashboardParams.push(limit);

    const dashboardImages = await executeQuery<any[]>(
      dashboardQuery,
      dashboardParams
    );

    // Also get IoT-specific images if they exist
    let iotQuery = `
      SELECT * FROM iot_images 
      WHERE serial_number = ?
    `;
    const iotParams = [serialNumber];

    if (eventType) {
      iotQuery += " AND event_type = ?";
      iotParams.push(eventType);
    }

    iotQuery += " ORDER BY captured_at DESC LIMIT ?";
    iotParams.push(limit);

    const iotImages = await executeQuery<any[]>(iotQuery, iotParams);

    return NextResponse.json({
      serial_number: serialNumber,
      device_name: iotDevice[0].device_name,
      dashboard_images: dashboardImages,
      iot_images: iotImages,
      total_images: dashboardImages.length + iotImages.length,
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
