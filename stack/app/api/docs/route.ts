import { NextRequest, NextResponse } from "next/server";

const API_DOCS = {
  openapi: "3.0.3",
  info: {
    title: "Mail Guard IoT API",
    description:
      "Smart Mailbox Monitoring System API - IoT Device → HTTP API → User Dashboard",
    version: "2.0.0",
    contact: {
      name: "Mail Guard Team",
      email: "support@mailguard.com",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Mail Guard API Server",
    },
  ],
  tags: [
    {
      name: "🌐 IoT Core",
      description: "Core IoT device communication endpoints",
    },
    {
      name: "📱 Device Management",
      description: "User device connection and management",
    },
    {
      name: "📊 Dashboard",
      description: "User dashboard and data display",
    },
    {
      name: "🔧 Setup",
      description: "Database and system initialization",
    },
  ],
  paths: {
    "/iot/event": {
      post: {
        tags: ["🌐 IoT Core"],
        summary: "🚨 MAIN ENDPOINT: Receive IoT Events",
        description:
          "Primary endpoint for IoT devices to send mailbox events (open, close, delivery, removal)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serial_number", "event_data"],
                properties: {
                  serial_number: {
                    type: "string",
                    description: "Device serial number",
                    example: "SN001234567",
                  },
                  event_data: {
                    type: "object",
                    required: ["reed_sensor"],
                    properties: {
                      reed_sensor: {
                        type: "boolean",
                        description:
                          "Reed sensor state (true=open, false=closed)",
                        example: true,
                      },
                      event_type: {
                        type: "string",
                        enum: ["open", "close", "delivery", "removal"],
                        description: "Type of mailbox event",
                        example: "open",
                      },
                      mailbox_status: {
                        type: "string",
                        description: "Human readable status",
                        example: "opened",
                      },
                    },
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    description: "Event timestamp",
                    example: "2024-01-15T10:30:00Z",
                  },
                  firmware_version: {
                    type: "string",
                    description: "Device firmware version",
                    example: "1.2.0",
                  },
                  battery_level: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    description: "Battery level percentage",
                    example: 85,
                  },
                  signal_strength: {
                    type: "integer",
                    minimum: -120,
                    maximum: 0,
                    description: "Signal strength in dBm",
                    example: -45,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Event recorded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    event_id: { type: "integer" },
                    event_type: { type: "string" },
                    device_id: { type: "integer" },
                    serial_number: { type: "string" },
                    status: {
                      type: "string",
                      enum: ["claimed_device", "unclaimed_device"],
                    },
                    processed_at: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Invalid device serial number",
          },
        },
      },
    },
    "/iot/activate": {
      get: {
        tags: ["🌐 IoT Core"],
        summary: "🔍 Validate Device Serial Number",
        description:
          "Device validation and status check for connecting devices",
        parameters: [
          {
            name: "serial_number",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Device serial number to validate",
            example: "SN001234567",
          },
        ],
        responses: {
          "200": {
            description: "Device status retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    serial_number: { type: "string" },
                    is_valid: { type: "boolean" },
                    is_claimed: { type: "boolean" },
                    device_model: { type: "string" },
                    dashboard_linked: { type: "boolean" },
                    status: {
                      type: "object",
                      nullable: true,
                      properties: {
                        is_online: { type: "boolean" },
                        last_seen: { type: "string", format: "date-time" },
                        firmware_version: { type: "string" },
                        battery_level: { type: "integer" },
                        signal_strength: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Device not found",
          },
        },
      },
    },
    "/iot/upload": {
      post: {
        tags: ["🌐 IoT Core"],
        summary: "📸 Upload Files from IoT Device",
        description: "Handle file uploads (images, logs) from IoT devices",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "File to upload",
                  },
                  serial_number: {
                    type: "string",
                    description: "Device serial number",
                  },
                  file_type: {
                    type: "string",
                    enum: ["image", "log", "diagnostic"],
                    description: "Type of file",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "File uploaded successfully",
          },
        },
      },
    },
    "/iot/report": {
      post: {
        tags: ["🌐 IoT Core"],
        summary: "📊 Device Status Reports",
        description: "Periodic health and status reports from IoT devices",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serial_number"],
                properties: {
                  serial_number: {
                    type: "string",
                    description: "Device serial number",
                    example: "SN001234567",
                  },
                  firmware_version: {
                    type: "string",
                    example: "1.2.0",
                  },
                  battery_level: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    example: 75,
                  },
                  signal_strength: {
                    type: "integer",
                    example: -55,
                  },
                  temperature_celsius: {
                    type: "integer",
                    description: "Device temperature",
                    example: 25,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Status report received successfully",
          },
        },
      },
    },
    "/dashboard": {
      get: {
        tags: ["📊 Dashboard"],
        summary: "🏠 Get User Dashboard Data",
        description: "Main dashboard endpoint for displaying user's IoT data",
        parameters: [
          {
            name: "clerk_id",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "User ID from Clerk authentication",
            example: "user_2abc123def456",
          },
        ],
        responses: {
          "200": {
            description: "Dashboard data retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    devices: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Device" },
                    },
                    recent_events: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Event" },
                    },
                    recent_images: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Image" },
                    },
                    notification_count: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing clerk_id parameter",
          },
        },
      },
    },
    "/devices": {
      post: {
        tags: ["📱 Device Management"],
        summary: "🔗 Connect Device to User Account",
        description: "Create device record when user connects an IoT device",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clerk_id", "name", "serial_number"],
                properties: {
                  clerk_id: {
                    type: "string",
                    description: "User ID from Clerk",
                    example: "user_2abc123def456",
                  },
                  email: {
                    type: "string",
                    description: "User email",
                    example: "user@example.com",
                  },
                  name: {
                    type: "string",
                    description: "Custom device name",
                    example: "Main Mailbox Monitor",
                  },
                  location: {
                    type: "string",
                    description: "Device location",
                    example: "Front Door Mailbox",
                  },
                  serial_number: {
                    type: "string",
                    description: "Device serial number",
                    example: "SN001234567",
                  },
                  is_active: {
                    type: "boolean",
                    description: "Whether device is active",
                    example: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Device connected successfully",
          },
        },
      },
    },
    "/devices/{id}": {
      get: {
        tags: ["📱 Device Management"],
        summary: "📱 Get Device Details",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Device ID",
          },
          {
            name: "clerk_id",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "User ID from Clerk",
          },
        ],
        responses: {
          "200": {
            description: "Device details retrieved successfully",
          },
        },
      },
      delete: {
        tags: ["📱 Device Management"],
        summary: "🗑️ Remove Device from Account",
        description: "Disconnect device from user account",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Device ID",
          },
          {
            name: "clerk_id",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "User ID from Clerk",
          },
        ],
        responses: {
          "200": {
            description: "Device removed successfully",
          },
        },
      },
    },
    "/init-db": {
      post: {
        tags: ["🔧 Setup"],
        summary: "🗄️ Initialize Database",
        description: "Create all required database tables and schema",
        responses: {
          "200": {
            description: "Database initialized successfully",
          },
          "207": {
            description: "Partial success - some operations failed",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Device: {
        type: "object",
        properties: {
          id: { type: "integer" },
          clerk_id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          serial_number: { type: "string" },
          location: { type: "string" },
          is_active: { type: "boolean" },
          last_seen: { type: "string", format: "date-time" },
          created_at: { type: "string", format: "date-time" },
          is_online: { type: "boolean" },
          battery_level: { type: "integer" },
          signal_strength: { type: "integer" },
          firmware_version: { type: "string" },
          iot_last_seen: { type: "string", format: "date-time" },
        },
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "integer" },
          device_id: { type: "integer" },
          event_type: {
            type: "string",
            enum: ["open", "close", "delivery", "removal"],
          },
          occurred_at: { type: "string", format: "date-time" },
          clerk_id: { type: "string" },
        },
      },
      Image: {
        type: "object",
        properties: {
          id: { type: "integer" },
          device_id: { type: "integer" },
          image_url: { type: "string" },
          captured_at: { type: "string", format: "date-time" },
          event_id: { type: "integer" },
        },
      },
    },
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  if (format === "html") {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Mail Guard IoT API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs?format=json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  return NextResponse.json(API_DOCS, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
