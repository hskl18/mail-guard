import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// POST /api/init-db - Initialize the entire database schema
export async function POST(request: NextRequest) {
  const results: string[] = [];
  const errors: string[] = [];

  try {
    // Create device_serials table for valid serial numbers
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS device_serials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          serial_number VARCHAR(255) NOT NULL UNIQUE,
          device_model VARCHAR(100) DEFAULT 'mailbox_monitor_v1',
          manufactured_date DATE,
          is_valid TINYINT(1) DEFAULT 1,
          is_claimed TINYINT(1) DEFAULT 0,
          claimed_by_clerk_id VARCHAR(255),
          claimed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_serial_number (serial_number),
          INDEX idx_is_valid (is_valid),
          INDEX idx_is_claimed (is_claimed),
          INDEX idx_claimed_by (claimed_by_clerk_id),
          UNIQUE KEY unique_serial (serial_number)
        )
      `);
      results.push("✅ Device serials table created/verified");
    } catch (error) {
      errors.push(
        `❌ Device serials table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create iot_device_status table for IoT device runtime data
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS iot_device_status (
          id INT AUTO_INCREMENT PRIMARY KEY,
          serial_number VARCHAR(255) NOT NULL,
          last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
          firmware_version VARCHAR(50),
          battery_level INT,
          signal_strength INT,
          is_online TINYINT(1) DEFAULT 0,
          device_type VARCHAR(50) DEFAULT 'mailbox_monitor',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_serial_number (serial_number),
          INDEX idx_last_seen (last_seen),
          INDEX idx_is_online (is_online),
          FOREIGN KEY (serial_number) REFERENCES device_serials(serial_number) ON DELETE CASCADE
        )
      `);
      results.push("✅ IoT device status table created/verified");
    } catch (error) {
      errors.push(
        `❌ IoT device status table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create devices table (user dashboard devices, linked to IoT devices)
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS devices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          clerk_id VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          serial_number VARCHAR(255) UNIQUE,
          location VARCHAR(255),
          is_active TINYINT(1) DEFAULT 1,
          last_seen DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          mail_delivered_notify TINYINT(1) DEFAULT 1,
          mailbox_opened_notify TINYINT(1) DEFAULT 1,
          mail_removed_notify TINYINT(1) DEFAULT 1,
          battery_low_notify TINYINT(1) DEFAULT 1,
          push_notifications TINYINT(1) DEFAULT 1,
          email_notifications TINYINT(1) DEFAULT 1,
          check_interval INT DEFAULT 30,
          battery_threshold INT DEFAULT 20,
          capture_image_on_open TINYINT(1) DEFAULT 1,
          capture_image_on_delivery TINYINT(1) DEFAULT 1,
          INDEX idx_clerk_id (clerk_id),
          INDEX idx_serial_number (serial_number),
          INDEX idx_is_active (is_active),
          FOREIGN KEY (serial_number) REFERENCES device_serials(serial_number) ON DELETE SET NULL
        )
      `);
      results.push("✅ Devices table created/verified");
    } catch (error) {
      errors.push(
        `❌ Devices table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create events table
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          device_id INT NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          clerk_id VARCHAR(255),
          INDEX idx_device_id (device_id),
          INDEX idx_event_type (event_type),
          INDEX idx_occurred_at (occurred_at),
          INDEX idx_clerk_id (clerk_id),
          FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        )
      `);
      results.push("✅ Events table created/verified");
    } catch (error) {
      errors.push(
        `❌ Events table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create images table
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          device_id INT NOT NULL,
          image_url VARCHAR(500) NOT NULL,
          captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          event_id INT,
          INDEX idx_device_id (device_id),
          INDEX idx_captured_at (captured_at),
          INDEX idx_event_id (event_id),
          FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        )
      `);
      results.push("✅ Images table created/verified");
    } catch (error) {
      errors.push(
        `❌ Images table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create notifications table (WITHOUT clerk_id since we'll get it from device)
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          device_id INT NOT NULL,
          notification_type VARCHAR(100) NOT NULL,
          message TEXT,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_read TINYINT(1) DEFAULT 0,
          INDEX idx_device_id (device_id),
          INDEX idx_sent_at (sent_at),
          INDEX idx_is_read (is_read),
          FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        )
      `);
      results.push("✅ Notifications table created/verified");
    } catch (error) {
      errors.push(
        `❌ Notifications table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create device_health table
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS device_health (
          id INT AUTO_INCREMENT PRIMARY KEY,
          device_id INT NOT NULL,
          clerk_id VARCHAR(255),
          battery_level INT,
          signal_strength INT,
          temperature DECIMAL(5,2),
          firmware_version VARCHAR(50),
          reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_device_id (device_id),
          INDEX idx_clerk_id (clerk_id),
          INDEX idx_reported_at (reported_at),
          FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        )
      `);
      results.push("✅ Device health table created/verified");
    } catch (error) {
      errors.push(
        `❌ Device health table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create iot_events table for unclaimed device events
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS iot_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          serial_number VARCHAR(255) NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          event_data TEXT,
          occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_serial_number (serial_number),
          INDEX idx_event_type (event_type),
          INDEX idx_occurred_at (occurred_at),
          FOREIGN KEY (serial_number) REFERENCES device_serials(serial_number) ON DELETE CASCADE
        )
      `);
      results.push("✅ IoT events table created/verified");
    } catch (error) {
      errors.push(
        `❌ IoT events table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Create iot_images table for unclaimed device images
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS iot_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          serial_number VARCHAR(255) NOT NULL,
          image_url VARCHAR(500) NOT NULL,
          event_type VARCHAR(50),
          captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          file_size INT,
          INDEX idx_serial_number (serial_number),
          INDEX idx_event_type (event_type),
          INDEX idx_captured_at (captured_at),
          FOREIGN KEY (serial_number) REFERENCES device_serials(serial_number) ON DELETE CASCADE
        )
      `);
      results.push("✅ IoT images table created/verified");
    } catch (error) {
      errors.push(
        `❌ IoT images table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Insert sample data if tables are empty
    try {
      const serialCount = await executeQuery<any[]>(
        "SELECT COUNT(*) as count FROM device_serials"
      );
      if (serialCount[0].count === 0) {
        // Insert sample valid serial numbers
        await executeQuery(`
          INSERT INTO device_serials (serial_number, device_model, manufactured_date) VALUES 
          ('SN001234567', 'mailbox_monitor_v1', '2024-01-01'),
          ('SN001234568', 'mailbox_monitor_v1', '2024-01-01'),
          ('SN001234569', 'mailbox_monitor_v1', '2024-01-01'),
          ('SN001234570', 'mailbox_monitor_v2', '2024-01-15'),
          ('SN001234571', 'mailbox_monitor_v2', '2024-01-15'),
          ('TEST-DEVICE-001', 'mailbox_monitor_v1', '2024-01-01')
        `);
        results.push("✅ Sample serial numbers inserted");
      } else {
        results.push("ℹ️ Serial numbers already exist, skipping sample data");
      }

      const deviceCount = await executeQuery<any[]>(
        "SELECT COUNT(*) as count FROM devices"
      );
      if (deviceCount[0].count === 0) {
        await executeQuery(`
          INSERT INTO devices (clerk_id, email, name, serial_number, location, is_active) VALUES 
          ('sample_user_1', 'sample@example.com', 'Sample Mailbox', 'SN001234567', 'Main Lobby', 1)
        `);

        // Mark this serial as claimed
        await executeQuery(`
          UPDATE device_serials 
          SET is_claimed = 1, claimed_by_clerk_id = 'sample_user_1', claimed_at = NOW()
          WHERE serial_number = 'SN001234567'
        `);

        results.push("✅ Sample device data inserted");
      } else {
        results.push("ℹ️ Device data already exists, skipping sample data");
      }
    } catch (error) {
      errors.push(
        `❌ Sample data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    const summary = {
      success: errors.length === 0,
      total_operations: results.length + errors.length,
      successful_operations: results.length,
      failed_operations: errors.length,
      results,
      errors,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(summary, {
      status: errors.length === 0 ? 200 : 207, // 207 Multi-Status for partial success
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        message: error instanceof Error ? error.message : "Unknown error",
        results,
        errors,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
