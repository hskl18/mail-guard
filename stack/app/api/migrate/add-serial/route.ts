import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// POST /api/migrate/add-serial - Add serial_number field to devices table
export async function POST(request: NextRequest) {
  try {
    // Check if column already exists
    const columnExists = await executeQuery<any[]>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'devices' 
       AND COLUMN_NAME = 'serial_number'`
    );

    if (columnExists.length === 0) {
      // Add serial_number column
      await executeQuery(
        "ALTER TABLE devices ADD COLUMN serial_number VARCHAR(255) UNIQUE"
      );

      // Add index for faster lookups (if not automatically created by UNIQUE constraint)
      try {
        await executeQuery(
          "ALTER TABLE devices ADD INDEX idx_serial_number (serial_number)"
        );
      } catch (indexError) {
        // Index might already exist due to UNIQUE constraint
        console.log(
          "Index creation skipped (likely exists due to UNIQUE constraint)"
        );
      }

      return NextResponse.json({
        message: "Successfully added serial_number field to devices table",
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        message: "serial_number field already exists in devices table",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Failed to add serial_number field",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
