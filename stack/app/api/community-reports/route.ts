import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// POST /api/community-reports - Submit a community safety report
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { zip_code, description, image_url } = body;

    // Validate required fields
    if (!zip_code) {
      return NextResponse.json(
        { error: "Zip code is required" },
        { status: 400 }
      );
    }

    // Validate zip code format (US zip code: 5 digits or 5+4 format)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zip_code)) {
      return NextResponse.json(
        {
          error:
            "Invalid zip code format. Please use 12345 or 12345-6789 format.",
        },
        { status: 400 }
      );
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

    return NextResponse.json(
      {
        message: "Community report submitted successfully",
        report: createdReport[0],
        report_id: reportId,
      },
      { status: 201 }
    );
  } catch (error) {
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

// GET /api/community-reports - Get community reports for the user's area
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get("zip_code");
    const status = searchParams.get("status");
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "20"))
    );

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

// PATCH /api/community-reports - Update report status (for committee members)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { report_id, status, reviewer_notes } = body;

    // Validate required fields
    if (!report_id || !status) {
      return NextResponse.json(
        { error: "Report ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!["pending", "reviewed", "resolved"].includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be 'pending', 'reviewed', or 'resolved'",
        },
        { status: 400 }
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
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Report status updated successfully",
      report: updatedReport[0],
    });
  } catch (error) {
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
