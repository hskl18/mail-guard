import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { Image } from "@/lib/types";

// GET /api/images - Get images for a device/user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");
    const clerkId = searchParams.get("clerk_id");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = `
      SELECT i.*, d.name as device_name 
      FROM images i 
      LEFT JOIN devices d ON i.device_id = d.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (deviceId) {
      query += " AND i.device_id = ?";
      params.push(deviceId);
    }

    if (clerkId) {
      query += " AND d.clerk_id = ?";
      params.push(clerkId);
    }

    query += " ORDER BY i.captured_at DESC LIMIT ?";
    params.push(limit);

    const images = await executeQuery<any[]>(query, params);
    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// POST /api/images - Upload/create a new image record
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deviceId = formData.get("device_id") as string;
    const eventId = formData.get("event_id") as string;
    const file = formData.get("image") as File;

    if (!deviceId || !file) {
      return NextResponse.json(
        { error: "Missing required fields: device_id, image" },
        { status: 400 }
      );
    }

    // In a real implementation, you would upload the file to S3 or another storage service
    // For now, we'll create a placeholder URL
    const imageUrl = `/uploads/${deviceId}_${Date.now()}_${file.name}`;

    const result = await executeQuery(
      `INSERT INTO images (device_id, image_url, event_id) 
       VALUES (?, ?, ?)`,
      [deviceId, imageUrl, eventId || null]
    );

    const insertResult = result as any;
    const newImage = await executeQuery<any[]>(
      `SELECT i.*, d.name as device_name 
       FROM images i 
       LEFT JOIN devices d ON i.device_id = d.id 
       WHERE i.id = ?`,
      [insertResult.insertId]
    );

    return NextResponse.json(
      {
        message: "Image uploaded successfully",
        image: newImage[0],
        // In a real implementation, you might return a signed URL for the uploaded file
        upload_info: {
          original_name: file.name,
          size: file.size,
          type: file.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
