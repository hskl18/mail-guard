import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getFromS3 } from "@/lib/s3";

// GET /api/image/[id] - Stream image content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;

  if (!imageId) {
    return NextResponse.json(
      { error: "Image ID is required" },
      { status: 400 }
    );
  }

  try {
    let imageUrl = "";
    let imageData = null;

    // Check if it's an IoT image (starts with "iot_")
    if (imageId.startsWith("iot_")) {
      const actualId = imageId.replace("iot_", "");
      const iotImages = await executeQuery<any[]>(
        "SELECT * FROM iot_images WHERE id = ?",
        [actualId]
      );

      if (iotImages.length === 0) {
        return NextResponse.json(
          { error: "IoT image not found" },
          { status: 404 }
        );
      }

      imageData = iotImages[0];
      imageUrl = imageData.image_url;
    } else {
      // Regular dashboard image
      const images = await executeQuery<any[]>(
        "SELECT * FROM images WHERE id = ?",
        [imageId]
      );

      if (images.length === 0) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      imageData = images[0];
      imageUrl = imageData.image_url;
    }

    // Extract S3 key from URL
    const s3Key = imageUrl.split(".amazonaws.com/")[1];
    if (!s3Key) {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      );
    }

    try {
      // Get image from S3
      const s3Response = await getFromS3(s3Key);

      if (!s3Response.Body) {
        return NextResponse.json(
          { error: "Image content not found" },
          { status: 404 }
        );
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = s3Response.Body as any;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Return image with proper headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": s3Response.ContentType || "image/jpeg",
          "Cache-Control": "public, max-age=3600",
          "Content-Length": buffer.length.toString(),
        },
      });
    } catch (s3Error) {
      console.error("S3 fetch error:", s3Error);
      return NextResponse.json(
        { error: "Failed to fetch image from storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}

// HEAD /api/image/[id] - Check if image exists
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;

  if (!imageId) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    let imageExists = false;

    // Check if it's an IoT image (starts with "iot_")
    if (imageId.startsWith("iot_")) {
      const actualId = imageId.replace("iot_", "");
      const iotImages = await executeQuery<any[]>(
        "SELECT id FROM iot_images WHERE id = ?",
        [actualId]
      );
      imageExists = iotImages.length > 0;
    } else {
      // Regular dashboard image
      const images = await executeQuery<any[]>(
        "SELECT id FROM images WHERE id = ?",
        [imageId]
      );
      imageExists = images.length > 0;
    }

    return new NextResponse(null, {
      status: imageExists ? 200 : 404,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error checking image:", error);
    return new NextResponse(null, { status: 500 });
  }
}
