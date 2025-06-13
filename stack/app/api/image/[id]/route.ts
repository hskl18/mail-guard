import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getFromS3 } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import {
  createSecurityResponse,
  logSecurityEvent,
  checkRateLimit,
} from "@/lib/api-security";

// GET /api/image/[id] - Stream image content (SECURED)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require user authentication
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "IMAGE_ACCESS_UNAUTHORIZED",
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
        "IMAGE_ACCESS_RATE_LIMITED",
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

    const { id: imageId } = await params;

    if (!imageId) {
      return createSecurityResponse("Image ID is required", 400);
    }

    // SECURITY: Validate image ID format
    if (
      typeof imageId !== "string" ||
      (!/^\d+$/.test(imageId) && !imageId.startsWith("iot_"))
    ) {
      logSecurityEvent(
        "IMAGE_ACCESS_INVALID_ID",
        {
          userId,
          imageId,
        },
        request
      );

      return createSecurityResponse("Invalid image ID format", 400);
    }

    let imageUrl = "";
    let imageData = null;
    let authorizedAccess = false;

    // Check if it's an IoT image (starts with "iot_")
    if (imageId.startsWith("iot_")) {
      const actualId = imageId.replace("iot_", "");

      // SECURITY: Check if user has access to this IoT image
      const iotImages = await executeQuery<any[]>(
        `SELECT ii.*, ds.claimed_by_clerk_id 
         FROM iot_images ii
         JOIN device_serials ds ON ii.serial_number = ds.serial_number
         WHERE ii.id = ?`,
        [actualId]
      );

      if (iotImages.length === 0) {
        logSecurityEvent(
          "IMAGE_ACCESS_IOT_NOT_FOUND",
          {
            userId,
            imageId: actualId,
          },
          request
        );

        return createSecurityResponse("IoT image not found", 404);
      }

      imageData = iotImages[0];

      // SECURITY: Check if user owns the device that captured this image
      authorizedAccess = imageData.claimed_by_clerk_id === userId;

      if (!authorizedAccess) {
        // Also check if device is linked to user's dashboard
        const dashboardDevice = await executeQuery<any[]>(
          `SELECT id FROM devices WHERE serial_number = ? AND clerk_id = ?`,
          [imageData.serial_number, userId]
        );
        authorizedAccess = dashboardDevice.length > 0;
      }

      if (!authorizedAccess) {
        logSecurityEvent(
          "IMAGE_ACCESS_IOT_UNAUTHORIZED",
          {
            userId,
            imageId: actualId,
            serialNumber: imageData.serial_number,
            ownerId: imageData.claimed_by_clerk_id,
          },
          request
        );

        return createSecurityResponse("Unauthorized access to image", 403);
      }

      imageUrl = imageData.image_url;
    } else {
      // Regular dashboard image
      // SECURITY: Check if user has access to this dashboard image
      const images = await executeQuery<any[]>(
        `SELECT i.*, d.clerk_id 
         FROM images i
         JOIN devices d ON i.device_id = d.id
         WHERE i.id = ?`,
        [imageId]
      );

      if (images.length === 0) {
        logSecurityEvent(
          "IMAGE_ACCESS_NOT_FOUND",
          {
            userId,
            imageId,
          },
          request
        );

        return createSecurityResponse("Image not found", 404);
      }

      imageData = images[0];

      // SECURITY: Check if user owns the device that captured this image
      if (imageData.clerk_id !== userId) {
        logSecurityEvent(
          "IMAGE_ACCESS_UNAUTHORIZED",
          {
            userId,
            imageId,
            deviceId: imageData.device_id,
            ownerId: imageData.clerk_id,
          },
          request
        );

        return createSecurityResponse("Unauthorized access to image", 403);
      }

      imageUrl = imageData.image_url;
    }

    // Extract S3 key from URL
    const s3Key = imageUrl.split(".amazonaws.com/")[1];
    if (!s3Key) {
      logSecurityEvent(
        "IMAGE_ACCESS_INVALID_URL",
        {
          userId,
          imageId,
          imageUrl,
        },
        request
      );

      return createSecurityResponse("Invalid image URL format", 400);
    }

    try {
      // Get image from S3
      const s3Response = await getFromS3(s3Key);

      if (!s3Response.Body) {
        logSecurityEvent(
          "IMAGE_ACCESS_S3_NOT_FOUND",
          {
            userId,
            imageId,
            s3Key,
          },
          request
        );

        return createSecurityResponse("Image content not found", 404);
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = s3Response.Body as any;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      logSecurityEvent(
        "IMAGE_ACCESS_SUCCESS",
        {
          userId,
          imageId,
          imageType: imageId.startsWith("iot_") ? "iot" : "dashboard",
          fileSize: buffer.length,
        },
        request
      );

      // Return image with proper headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": s3Response.ContentType || "image/jpeg",
          "Cache-Control": "private, max-age=3600", // Changed to private for security
          "Content-Length": buffer.length.toString(),
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      });
    } catch (s3Error) {
      logSecurityEvent(
        "IMAGE_ACCESS_S3_ERROR",
        {
          userId,
          imageId,
          s3Key,
          error: s3Error instanceof Error ? s3Error.message : "S3 error",
        },
        request
      );

      console.error("S3 fetch error:", s3Error);
      return createSecurityResponse("Failed to fetch image from storage", 500);
    }
  } catch (error) {
    logSecurityEvent(
      "IMAGE_ACCESS_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("Error fetching image:", error);
    return createSecurityResponse("Failed to fetch image", 500);
  }
}

// HEAD /api/image/[id] - Check if image exists (SECURED)
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require user authentication
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "IMAGE_HEAD_UNAUTHORIZED",
        {
          url: request.url,
        },
        request
      );

      return new NextResponse(null, { status: 401 });
    }

    // SECURITY: Rate limiting
    if (!checkRateLimit(`user_${userId}`, 1000)) {
      // 1000 requests per hour for users
      return new NextResponse(null, { status: 429 });
    }

    const { id: imageId } = await params;

    if (!imageId) {
      return new NextResponse(null, { status: 400 });
    }

    // SECURITY: Validate image ID format
    if (
      typeof imageId !== "string" ||
      (!/^\d+$/.test(imageId) && !imageId.startsWith("iot_"))
    ) {
      return new NextResponse(null, { status: 400 });
    }

    let imageExists = false;
    let authorizedAccess = false;

    // Check if it's an IoT image (starts with "iot_")
    if (imageId.startsWith("iot_")) {
      const actualId = imageId.replace("iot_", "");

      // SECURITY: Check if user has access to this IoT image
      const iotImages = await executeQuery<any[]>(
        `SELECT ii.id, ds.claimed_by_clerk_id, ii.serial_number
         FROM iot_images ii
         JOIN device_serials ds ON ii.serial_number = ds.serial_number
         WHERE ii.id = ?`,
        [actualId]
      );

      if (iotImages.length > 0) {
        imageExists = true;
        const imageData = iotImages[0];

        // Check authorization
        authorizedAccess = imageData.claimed_by_clerk_id === userId;

        if (!authorizedAccess) {
          // Also check if device is linked to user's dashboard
          const dashboardDevice = await executeQuery<any[]>(
            `SELECT id FROM devices WHERE serial_number = ? AND clerk_id = ?`,
            [imageData.serial_number, userId]
          );
          authorizedAccess = dashboardDevice.length > 0;
        }
      }
    } else {
      // Regular dashboard image
      // SECURITY: Check if user has access to this dashboard image
      const images = await executeQuery<any[]>(
        `SELECT i.id, d.clerk_id 
         FROM images i
         JOIN devices d ON i.device_id = d.id
         WHERE i.id = ?`,
        [imageId]
      );

      if (images.length > 0) {
        imageExists = true;
        const imageData = images[0];
        authorizedAccess = imageData.clerk_id === userId;
      }
    }

    // Return 404 if image doesn't exist OR user is not authorized (security by obscurity)
    const canAccess = imageExists && authorizedAccess;

    if (!canAccess && imageExists) {
      logSecurityEvent(
        "IMAGE_HEAD_UNAUTHORIZED_ACCESS",
        {
          userId,
          imageId,
          imageExists,
          authorizedAccess,
        },
        request
      );
    }

    return new NextResponse(null, {
      status: canAccess ? 200 : 404,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600", // Changed to private for security
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error) {
    logSecurityEvent(
      "IMAGE_HEAD_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      request
    );

    console.error("Error checking image:", error);
    return new NextResponse(null, { status: 500 });
  }
}
