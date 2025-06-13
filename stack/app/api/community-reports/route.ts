import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {
  createSecurityResponse,
  logSecurityEvent,
  checkRateLimit,
} from "@/lib/api-security";

// POST /api/community-reports - Submit a community safety report (SECURED)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "COMMUNITY_REPORT_UNAUTHORIZED",
        {
          url: request.url,
        },
        request
      );

      return createSecurityResponse("Authentication required", 401);
    }

    // SECURITY: Rate limiting - lower limit for reports to prevent spam
    if (!checkRateLimit(`user_${userId}_reports`, 50)) {
      // 50 reports per hour
      logSecurityEvent(
        "COMMUNITY_REPORT_RATE_LIMITED",
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

    const body = await request.json();
    const { zip_code, description, image_url } = body;

    // SECURITY: Validate required fields
    if (!zip_code) {
      logSecurityEvent(
        "COMMUNITY_REPORT_INVALID_DATA",
        {
          userId,
          hasZipCode: !!zip_code,
        },
        request
      );

      return createSecurityResponse("Zip code is required", 400);
    }

    // SECURITY: Validate zip code format (US zip code: 5 digits or 5+4 format)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zip_code)) {
      logSecurityEvent(
        "COMMUNITY_REPORT_INVALID_ZIP",
        {
          userId,
          zipCode: zip_code,
        },
        request
      );

      return createSecurityResponse(
        "Invalid zip code format. Please use 12345 or 12345-6789 format.",
        400
      );
    }

    // SECURITY: Validate description length if provided
    if (description && description.length > 2000) {
      logSecurityEvent(
        "COMMUNITY_REPORT_DESCRIPTION_TOO_LONG",
        {
          userId,
          descriptionLength: description.length,
        },
        request
      );

      return createSecurityResponse(
        "Description cannot exceed 2000 characters",
        400
      );
    }

    // SECURITY: Validate image URL format if provided
    if (image_url && typeof image_url === "string") {
      try {
        new URL(image_url);
      } catch {
        logSecurityEvent(
          "COMMUNITY_REPORT_INVALID_IMAGE_URL",
          {
            userId,
            imageUrl: image_url,
          },
          request
        );

        return createSecurityResponse("Invalid image URL format", 400);
      }
    }

    // Insert the community report
    const result = await executeQuery(
      `INSERT INTO community_reports 
       (clerk_id, zip_code, description, image_url, submitted_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, zip_code, description || null, image_url || null]
    );

    const reportId = (result as any).insertId;

    // Get the created report with formatted data
    const createdReport = await executeQuery<any[]>(
      `SELECT 
         id,
         clerk_id,
         zip_code,
         description,
         image_url,
         status,
         submitted_at,
         reviewed_at,
         resolved_at
       FROM community_reports 
       WHERE id = ?`,
      [reportId]
    );

    logSecurityEvent(
      "COMMUNITY_REPORT_CREATED",
      {
        userId,
        reportId,
        zipCode: zip_code,
        hasDescription: !!description,
        hasImage: !!image_url,
      },
      request
    );

    return NextResponse.json(
      {
        message: "Community report submitted successfully",
        report: createdReport[0],
        report_id: reportId,
      },
      { status: 201 }
    );
  } catch (error) {
    logSecurityEvent(
      "COMMUNITY_REPORT_CREATE_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("Community report submission error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit community report",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/community-reports - Get community reports for the user's area (SECURED)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "COMMUNITY_REPORT_GET_UNAUTHORIZED",
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
        "COMMUNITY_REPORT_GET_RATE_LIMITED",
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

    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get("zip_code");
    const status = searchParams.get("status");
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "20"))
    );

    // SECURITY: Validate status parameter if provided
    if (status && !["pending", "reviewed", "resolved"].includes(status)) {
      logSecurityEvent(
        "COMMUNITY_REPORT_INVALID_STATUS_FILTER",
        {
          userId,
          invalidStatus: status,
        },
        request
      );

      return createSecurityResponse("Invalid status filter", 400);
    }

    // SECURITY: Validate zip code parameter if provided
    if (zipCode) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(zipCode)) {
        logSecurityEvent(
          "COMMUNITY_REPORT_INVALID_ZIP_FILTER",
          {
            userId,
            invalidZip: zipCode,
          },
          request
        );

        return createSecurityResponse("Invalid zip code format", 400);
      }
    }

    let query = `
      SELECT 
        cr.id,
        cr.clerk_id,
        cr.zip_code,
        cr.description,
        cr.image_url,
        cr.status,
        cr.submitted_at,
        cr.reviewed_at,
        cr.resolved_at,
        cr.reviewer_notes
      FROM community_reports cr
      WHERE 1=1
    `;

    const params: any[] = [];

    // If zip code is provided, filter by zip code
    if (zipCode) {
      query += ` AND cr.zip_code = ?`;
      params.push(zipCode);
    } else {
      // If no zip code provided, show all reports (committee can see all reports)
      // In a real application, you might want to restrict this based on user role
      // For now, showing all reports so committee members can see community submissions
    }

    // Filter by status if provided
    if (status && ["pending", "reviewed", "resolved"].includes(status)) {
      query += ` AND cr.status = ?`;
      params.push(status);
    }

    // Use string interpolation for LIMIT to avoid parameter binding issues
    query += ` ORDER BY cr.submitted_at DESC LIMIT ${limit}`;

    const reports = await executeQuery<any[]>(query, params);

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM community_reports
      ${zipCode ? "WHERE zip_code = ?" : ""}
    `;

    const statsParams = zipCode ? [zipCode] : [];
    const stats = await executeQuery<any[]>(statsQuery, statsParams);

    logSecurityEvent(
      "COMMUNITY_REPORTS_RETRIEVED",
      {
        userId,
        reportCount: reports.length,
        filters: { zipCode, status, limit },
      },
      request
    );

    return NextResponse.json({
      reports: reports.map((report) => ({
        ...report,
        is_own_report: report.clerk_id === userId,
      })),
      statistics: stats[0],
      filters: {
        zip_code: zipCode,
        status: status,
        limit: limit,
      },
    });
  } catch (error) {
    logSecurityEvent(
      "COMMUNITY_REPORT_GET_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      request
    );

    console.error("Community reports fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch community reports",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/community-reports - Update report status (for committee members) (SECURED)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      logSecurityEvent(
        "COMMUNITY_REPORT_UPDATE_UNAUTHORIZED",
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
        "COMMUNITY_REPORT_UPDATE_RATE_LIMITED",
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

    const body = await request.json();
    const { report_id, status, reviewer_notes } = body;

    // SECURITY: Validate required fields
    if (!report_id || !status) {
      logSecurityEvent(
        "COMMUNITY_REPORT_UPDATE_INVALID_DATA",
        {
          userId,
          hasReportId: !!report_id,
          hasStatus: !!status,
        },
        request
      );

      return createSecurityResponse("Report ID and status are required", 400);
    }

    // SECURITY: Validate status value
    if (!["pending", "reviewed", "resolved"].includes(status)) {
      logSecurityEvent(
        "COMMUNITY_REPORT_UPDATE_INVALID_STATUS",
        {
          userId,
          reportId: report_id,
          invalidStatus: status,
        },
        request
      );

      return createSecurityResponse(
        "Invalid status. Must be 'pending', 'reviewed', or 'resolved'",
        400
      );
    }

    // SECURITY: Validate reviewer notes length if provided
    if (reviewer_notes && reviewer_notes.length > 1000) {
      logSecurityEvent(
        "COMMUNITY_REPORT_UPDATE_NOTES_TOO_LONG",
        {
          userId,
          reportId: report_id,
          notesLength: reviewer_notes.length,
        },
        request
      );

      return createSecurityResponse(
        "Reviewer notes cannot exceed 1000 characters",
        400
      );
    }

    // Update the report status
    const updateFields = ["status = ?"];
    const updateValues = [status];

    // Add timestamp fields based on status
    if (status === "reviewed") {
      updateFields.push("reviewed_at = NOW()");
    } else if (status === "resolved") {
      updateFields.push("resolved_at = NOW()");
      updateFields.push("reviewed_at = COALESCE(reviewed_at, NOW())"); // Set reviewed_at if not already set
    }

    // Add reviewer notes if provided
    if (reviewer_notes) {
      updateFields.push("reviewer_notes = ?");
      updateValues.push(reviewer_notes);
    }

    // Add report_id to the end of values array
    updateValues.push(report_id);

    const updateQuery = `
      UPDATE community_reports 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    await executeQuery(updateQuery, updateValues);

    // Get the updated report
    const updatedReport = await executeQuery<any[]>(
      `SELECT 
         id,
         clerk_id,
         zip_code,
         description,
         image_url,
         status,
         submitted_at,
         reviewed_at,
         resolved_at,
         reviewer_notes
       FROM community_reports 
       WHERE id = ?`,
      [report_id]
    );

    if (updatedReport.length === 0) {
      logSecurityEvent(
        "COMMUNITY_REPORT_UPDATE_NOT_FOUND",
        {
          userId,
          reportId: report_id,
        },
        request
      );

      return createSecurityResponse("Report not found", 404);
    }

    logSecurityEvent(
      "COMMUNITY_REPORT_UPDATED",
      {
        userId,
        reportId: report_id,
        newStatus: status,
        hasReviewerNotes: !!reviewer_notes,
      },
      request
    );

    return NextResponse.json({
      message: "Report status updated successfully",
      report: updatedReport[0],
    });
  } catch (error) {
    logSecurityEvent(
      "COMMUNITY_REPORT_UPDATE_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      request
    );

    console.error("Community report update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update community report",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
