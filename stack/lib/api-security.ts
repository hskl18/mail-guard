import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Rate limiting store (in production, use Redis)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// API Configuration
const API_CONFIG = {
  // Rate limiting (requests per window)
  IOT_RATE_LIMIT: 100, // 100 requests per hour for IoT devices
  USER_RATE_LIMIT: 1000, // 1000 requests per hour for users
  ADMIN_RATE_LIMIT: 10000, // 10000 requests per hour for admin
  WINDOW_MS: 60 * 60 * 1000, // 1 hour window

  // API Key requirements
  IOT_API_KEY_LENGTH: 64,
  ADMIN_API_KEY_LENGTH: 128,
};

// Security response messages
const SECURITY_MESSAGES = {
  INVALID_API_KEY: "Invalid or missing API key",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions for this operation",
  INVALID_REQUEST_FORMAT: "Invalid request format or missing required fields",
  DEVICE_NOT_AUTHORIZED: "Device not authorized for this operation",
  ADMIN_ACCESS_REQUIRED: "Administrator access required",
};

// API Key Types
export enum ApiKeyType {
  IOT_DEVICE = "iot_device",
  USER = "user",
  ADMIN = "admin",
  INTERNAL = "internal",
}

// API Key Interface
export interface ApiKeyInfo {
  id: string;
  type: ApiKeyType;
  deviceSerial?: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

// Rate limiting function
export function checkRateLimit(identifier: string, limit: number): boolean {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimit.get(key);

  if (!entry) {
    rateLimit.set(key, { count: 1, resetTime: now + API_CONFIG.WINDOW_MS });
    return true;
  }

  if (now > entry.resetTime) {
    // Reset the window
    rateLimit.set(key, { count: 1, resetTime: now + API_CONFIG.WINDOW_MS });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Generate secure API key
export function generateApiKey(type: ApiKeyType): string {
  const length =
    type === ApiKeyType.ADMIN
      ? API_CONFIG.ADMIN_API_KEY_LENGTH
      : API_CONFIG.IOT_API_KEY_LENGTH;

  const prefix =
    type === ApiKeyType.IOT_DEVICE
      ? "iot_"
      : type === ApiKeyType.ADMIN
      ? "admin_"
      : type === ApiKeyType.INTERNAL
      ? "int_"
      : "usr_";

  const randomBytes = crypto.randomBytes(length / 2).toString("hex");
  return `${prefix}${randomBytes}`;
}

// Hash API key for storage
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

// Validate API key format
export function isValidApiKeyFormat(
  apiKey: string,
  expectedType?: ApiKeyType
): boolean {
  if (!apiKey || typeof apiKey !== "string") return false;

  if (expectedType === ApiKeyType.IOT_DEVICE) {
    return apiKey.startsWith("iot_") && apiKey.length >= 68; // iot_ + 64 chars
  }

  if (expectedType === ApiKeyType.ADMIN) {
    return apiKey.startsWith("admin_") && apiKey.length >= 134; // admin_ + 128 chars
  }

  if (expectedType === ApiKeyType.INTERNAL) {
    return apiKey.startsWith("int_") && apiKey.length >= 68; // int_ + 64 chars
  }

  // General validation - must have a valid prefix
  return /^(iot_|admin_|int_|usr_)[a-f0-9]+$/.test(apiKey);
}

// Extract API key from request
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get("X-API-Key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (less secure, but useful for IoT devices)
  const url = new URL(request.url);
  const apiKeyParam = url.searchParams.get("api_key");
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
}

// Middleware for IoT device authentication
export async function authenticateIoTDevice(request: NextRequest): Promise<{
  success: boolean;
  deviceSerial?: string;
  error?: string;
  statusCode?: number;
}> {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return {
      success: false,
      error: SECURITY_MESSAGES.INVALID_API_KEY,
      statusCode: 401,
    };
  }

  if (!isValidApiKeyFormat(apiKey, ApiKeyType.IOT_DEVICE)) {
    return {
      success: false,
      error: SECURITY_MESSAGES.INVALID_API_KEY,
      statusCode: 401,
    };
  }

  // Check rate limit for this API key
  if (!checkRateLimit(`iot_${hashApiKey(apiKey)}`, API_CONFIG.IOT_RATE_LIMIT)) {
    return {
      success: false,
      error: SECURITY_MESSAGES.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
    };
  }

  try {
    // Verify API key exists and is active in database
    const hashedKey = hashApiKey(apiKey);
    const keyRecord = await verifyApiKeyInDatabase(
      hashedKey,
      ApiKeyType.IOT_DEVICE
    );

    if (!keyRecord) {
      return {
        success: false,
        error: SECURITY_MESSAGES.INVALID_API_KEY,
        statusCode: 401,
      };
    }

    // Update last used timestamp
    await updateApiKeyLastUsed(hashedKey);

    return {
      success: true,
      deviceSerial: keyRecord.deviceSerial,
    };
  } catch (error) {
    console.error("IoT authentication error:", error);
    return {
      success: false,
      error: "Authentication service temporarily unavailable",
      statusCode: 503,
    };
  }
}

// Middleware for admin authentication
export async function authenticateAdmin(request: NextRequest): Promise<{
  success: boolean;
  adminId?: string;
  error?: string;
  statusCode?: number;
}> {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return {
      success: false,
      error: SECURITY_MESSAGES.ADMIN_ACCESS_REQUIRED,
      statusCode: 401,
    };
  }

  if (!isValidApiKeyFormat(apiKey, ApiKeyType.ADMIN)) {
    return {
      success: false,
      error: SECURITY_MESSAGES.INVALID_API_KEY,
      statusCode: 401,
    };
  }

  // Check rate limit for admin API key
  if (
    !checkRateLimit(`admin_${hashApiKey(apiKey)}`, API_CONFIG.ADMIN_RATE_LIMIT)
  ) {
    return {
      success: false,
      error: SECURITY_MESSAGES.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
    };
  }

  try {
    const hashedKey = hashApiKey(apiKey);
    const keyRecord = await verifyApiKeyInDatabase(hashedKey, ApiKeyType.ADMIN);

    if (!keyRecord) {
      return {
        success: false,
        error: SECURITY_MESSAGES.INVALID_API_KEY,
        statusCode: 401,
      };
    }

    await updateApiKeyLastUsed(hashedKey);

    return {
      success: true,
      adminId: keyRecord.id,
    };
  } catch (error) {
    console.error("Admin authentication error:", error);
    return {
      success: false,
      error: "Authentication service temporarily unavailable",
      statusCode: 503,
    };
  }
}

// Database functions for API key management
async function verifyApiKeyInDatabase(
  hashedKey: string,
  type: ApiKeyType
): Promise<ApiKeyInfo | null> {
  try {
    const { executeQuery } = await import("./db");

    const results = await executeQuery<any[]>(
      `SELECT id, type, device_serial, permissions, created_at, last_used, is_active 
       FROM api_keys 
       WHERE key_hash = ? AND type = ? AND is_active = 1`,
      [hashedKey, type]
    );

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      type: row.type as ApiKeyType,
      deviceSerial: row.device_serial,
      permissions: JSON.parse(row.permissions || "[]"),
      createdAt: new Date(row.created_at),
      lastUsed: row.last_used ? new Date(row.last_used) : undefined,
      isActive: Boolean(row.is_active),
    };
  } catch (error) {
    console.error("Database verification error:", error);
    return null;
  }
}

async function updateApiKeyLastUsed(hashedKey: string): Promise<void> {
  try {
    const { executeQuery } = await import("./db");
    await executeQuery(
      "UPDATE api_keys SET last_used = NOW() WHERE key_hash = ?",
      [hashedKey]
    );
  } catch (error) {
    console.error("Error updating API key last used:", error);
  }
}

// Validate request payload
export function validateIoTEventPayload(body: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body) {
    errors.push("Request body is required");
    return { valid: false, errors };
  }

  if (!body.serial_number || typeof body.serial_number !== "string") {
    errors.push("serial_number is required and must be a string");
  }

  if (!body.event_data || typeof body.event_data !== "object") {
    errors.push("event_data is required and must be an object");
  } else {
    if (body.event_data.reed_sensor === undefined) {
      errors.push("event_data.reed_sensor is required");
    }
  }

  // Optional timestamp validation
  if (body.timestamp && typeof body.timestamp !== "string") {
    errors.push("timestamp must be a string if provided");
  }

  return { valid: errors.length === 0, errors };
}

// Security response helper
export function createSecurityResponse(
  error: string,
  statusCode: number,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    {
      error,
      timestamp: new Date().toISOString(),
      status: statusCode,
    },
    { status: statusCode }
  );

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Add rate limit headers if applicable
  if (statusCode === 429) {
    response.headers.set("Retry-After", "3600"); // 1 hour
  }

  // Add additional headers if provided
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Log security events
export function logSecurityEvent(
  event: string,
  details: any,
  request: NextRequest
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    url: request.url,
    method: request.method,
  };

  // In production, send to proper logging service
  console.warn("SECURITY EVENT:", JSON.stringify(logEntry, null, 2));
}

// Environment variable validation
export function validateSecurityEnvironment(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const requiredEnvVars = [
    "IOT_API_SECRET_KEY",
    "ADMIN_API_SECRET_KEY",
    "API_ENCRYPTION_SECRET",
  ];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// Generate internal API key for server-to-server communication
export function generateInternalApiKey(): string {
  const secret =
    process.env.API_ENCRYPTION_SECRET || "default-secret-change-me";
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(32).toString("hex");

  const payload = `${timestamp}:${randomBytes}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `int_${Buffer.from(`${payload}:${signature}`).toString("base64")}`;
}

// Verify internal API key
export function verifyInternalApiKey(apiKey: string): boolean {
  try {
    if (!apiKey.startsWith("int_")) return false;

    const secret =
      process.env.API_ENCRYPTION_SECRET || "default-secret-change-me";
    const payload = Buffer.from(apiKey.substring(4), "base64").toString();
    const [timestamp, randomBytes, signature] = payload.split(":");

    if (!timestamp || !randomBytes || !signature) return false;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}:${randomBytes}`)
      .digest("hex");

    if (signature !== expectedSignature) return false;

    // Check if key is not too old (24 hours)
    const keyAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return keyAge < maxAge;
  } catch (error) {
    return false;
  }
}
