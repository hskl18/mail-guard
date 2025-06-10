import type { Pool } from "mysql2/promise";
import { readFileSync } from "fs";
import path from "path";

// Lazy-loaded database configuration
let pool: Pool | null = null;

async function getPool(): Promise<Pool> {
  if (!pool) {
    const mysql = await import("mysql2/promise");

    // SSL configuration
    let sslConfig = undefined;

    if (process.env.MYSQL_SSL_CA) {
      // If SSL_CA is provided in environment, use it
      sslConfig = {
        ca: process.env.MYSQL_SSL_CA,
        rejectUnauthorized: false, // For cloud databases
      };
    } else {
      // Try to read from public/certs directory
      try {
        const certPath = path.join(
          process.cwd(),
          "public",
          "certs",
          "rds-ca.pem"
        );
        const ca = readFileSync(certPath, "utf8");
        sslConfig = {
          ca: ca,
          // For cloud databases, we often need to disable strict verification
          rejectUnauthorized: false,
        };
        console.log("Using SSL certificate from public/certs/rds-ca.pem");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(
          "SSL certificate not found, connecting without SSL:",
          errorMessage
        );
      }
    }

    // Check if we're connecting to a cloud database that might need different SSL handling
    const isCloudDatabase =
      process.env.MYSQL_HOST?.includes("aivencloud.com") ||
      process.env.MYSQL_HOST?.includes("amazonaws.com") ||
      process.env.MYSQL_HOST?.includes("digitalocean.com");

    if (isCloudDatabase && !sslConfig) {
      // For cloud databases, try to enable SSL without certificate verification
      sslConfig = {
        rejectUnauthorized: false,
      };
      console.log(
        "Cloud database detected, enabling SSL without certificate verification"
      );
    }

    // Database configuration with valid connection pool options
    const dbConfig = {
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: sslConfig,
      // Valid connection pool options only
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: false,
      timezone: "Z",
    };

    console.log(
      `Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}/${
        dbConfig.database
      } with SSL: ${sslConfig ? "enabled" : "disabled"}`
    );

    try {
      // Create a connection pool
      pool = mysql.createPool(dbConfig);

      // Test the connection
      const testConnection = await pool.getConnection();
      testConnection.release();
      console.log("Database connection test successful");
    } catch (error) {
      console.error("Database connection failed:", error);

      // If SSL connection fails, try without SSL as fallback
      if (sslConfig) {
        console.log(
          "SSL connection failed, attempting connection without SSL..."
        );
        const fallbackConfig = { ...dbConfig, ssl: undefined };

        try {
          pool = mysql.createPool(fallbackConfig);
          const testConnection = await pool.getConnection();
          testConnection.release();
          console.log("Fallback connection without SSL successful");
        } catch (fallbackError) {
          console.error("Fallback connection also failed:", fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  }

  return pool;
}

export async function executeQuery<T>(
  query: string,
  params: any[] = []
): Promise<T> {
  let connection = null;
  try {
    const dbPool = await getPool();
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(query, params);
    return rows as T;
  } catch (error) {
    console.error("Database error:", error);
    throw new Error("Database query failed");
  } finally {
    if (connection) {
      connection.release(); // Always release the connection back to the pool
    }
  }
}

// Function to close all database connections (useful for cleanup)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database connection pool closed");
  }
}

export default getPool;
