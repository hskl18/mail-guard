import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { readFileSync } from "fs";
import path from "path";
import { createVerifiedSslConfig } from "./database-tls.mjs";

// Lazy-loaded database configuration
let pool: Pool | null = null;

async function getPool(): Promise<Pool> {
  if (!pool) {
    const mysql = await import("mysql2/promise");

    // SSL configuration
    let sslConfig = undefined;

    if (process.env.MYSQL_SSL_CA) {
      // If SSL_CA is provided in environment, use it
      sslConfig = createVerifiedSslConfig(process.env.MYSQL_SSL_CA);
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
        sslConfig = createVerifiedSslConfig(ca);
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

    // Create and verify exactly one pool configuration.
    // TLS failures are surfaced instead of silently retrying without verification.
    pool = mysql.createPool(dbConfig);
    const testConnection = await pool.getConnection();
    testConnection.release();
    console.log("Database connection test successful");
  }

  return pool;
}

export async function executeQuery<T>(
  query: string,
  params: Parameters<Pool["execute"]>[1] = []
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

export type DatabaseRows = RowDataPacket[];
export type DatabaseResult = ResultSetHeader;
export type QueryParameters = Parameters<Pool["execute"]>[1];

// Function to close all database connections (useful for cleanup)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database connection pool closed");
  }
}

export default getPool;
