import { NextRequest, NextResponse } from "next/server";

const API_DOCS = {
  openapi: "3.0.3",
  info: {
    title: "Mail Guard API",
    description: "IoT Smart Mailbox Monitoring System API",
    version: "1.0.0",
    contact: {
      name: "Mail Guard Team",
      email: "support@mailguard.com",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Production API Server",
    },
  ],
  tags: [
    {
      name: "IoT Devices",
      description: "IoT device management and communication",
    },
    {
      name: "Dashboard",
      description: "User dashboard and device management",
    },
    {
      name: "Events",
      description: "Mailbox events and monitoring",
    },
    {
      name: "Images",
      description: "Image capture and storage",
    },
    {
      name: "Notifications",
      description: "User notifications",
    },
    {
      name: "Database",
      description: "Database management utilities",
    },
  ],
  paths: {
    "/iot/activate": {
      post: {
        tags: ["IoT Devices"],
        summary: "Validate IoT device serial number",
        description:
          "IoT device calls this endpoint to validate its serial number and check if it can operate. Does not require user authentication.",
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
                    example: "SN123456789",
                  },
                  firmware_version: {
                    type: "string",
                    description: "Device firmware version",
                    example: "1.2.3",
                  },
                  device_type: {
                    type: "string",
                    description: "Type of device",
                    example: "mailbox_monitor",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Device serial validated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    serial_number: { type: "string" },
                    status: { type: "string", enum: ["valid"] },
                    is_claimed: {
                      type: "boolean",
                      description: "Whether device is claimed by a user",
                    },
                    device_model: { type: "string" },
                    can_operate: { type: "boolean" },
                    last_seen: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Invalid serial number",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    serial_number: { type: "string" },
                    status: { type: "string", enum: ["invalid"] },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["IoT Devices"],
        summary: "Check device status and information",
        parameters: [
          {
            name: "serial_number",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Device serial number",
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
                    claimed_by: { type: "string", nullable: true },
                    claimed_at: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                    },
                    device_model: { type: "string" },
                    manufactured_date: { type: "string", format: "date" },
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
    "/devices/claim": {
      post: {
        tags: ["User Devices"],
        summary: "Claim IoT device",
        description:
          "User claims ownership of an IoT device using its serial number",
        security: [{ bearerAuth: [] }],
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
                    description: "Device serial number to claim",
                    example: "SN123456789",
                  },
                  device_name: {
                    type: "string",
                    description: "Custom name for the device",
                    example: "Main Mailbox",
                  },
                  location: {
                    type: "string",
                    description: "Device location",
                    example: "Building A Lobby",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Device claimed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    device: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        serial_number: { type: "string" },
                        location: { type: "string" },
                        device_model: { type: "string" },
                        claimed_at: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Invalid serial number",
          },
          "409": {
            description: "Device already claimed",
          },
        },
      },
    },
    "/iot/event": {
      post: {
        tags: ["IoT Devices", "Events"],
        summary: "Push event from IoT device",
        description:
          "Submit reed sensor data and mailbox events from IoT device",
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
                    example: "SN123456789",
                  },
                  event_data: {
                    type: "object",
                    required: ["reed_sensor"],
                    properties: {
                      reed_sensor: {
                        type: "boolean",
                        description:
                          "Reed sensor status (true = open, false = closed)",
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
                        description: "Additional mailbox status info",
                        example: "mailbox_opened",
                      },
                    },
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    description: "Event timestamp (ISO format)",
                    example: "2024-01-15T10:30:00Z",
                  },
                  firmware_version: {
                    type: "string",
                    example: "1.2.3",
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
                    minimum: -100,
                    maximum: 0,
                    description: "Signal strength in dBm",
                    example: -65,
                  },
                },
              },
              examples: {
                mailbox_opened: {
                  summary: "Mailbox opened event",
                  value: {
                    serial_number: "SN123456789",
                    event_data: {
                      reed_sensor: true,
                      event_type: "open",
                    },
                    battery_level: 85,
                    signal_strength: -65,
                  },
                },
                mailbox_closed: {
                  summary: "Mailbox closed event",
                  value: {
                    serial_number: "SN123456789",
                    event_data: {
                      reed_sensor: false,
                      event_type: "close",
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Event recorded successfully",
          },
          "404": {
            description: "Device not found or not activated",
          },
        },
      },
      get: {
        tags: ["IoT Devices", "Events"],
        summary: "Get device events",
        parameters: [
          {
            name: "serial_number",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Events retrieved successfully",
          },
        },
      },
    },
    "/iot/upload": {
      post: {
        tags: ["IoT Devices", "Images"],
        summary: "Upload image from IoT device",
        description: "Upload image file from IoT device to S3 storage",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "serial_number"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Image file (max 10MB)",
                  },
                  serial_number: {
                    type: "string",
                    description: "Device serial number",
                  },
                  event_type: {
                    type: "string",
                    description: "Related event type",
                    default: "general",
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                    description: "Image capture timestamp",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Image uploaded successfully",
          },
          "400": {
            description: "Invalid file or missing parameters",
          },
        },
      },
      get: {
        tags: ["IoT Devices", "Images"],
        summary: "Get device images",
        parameters: [
          {
            name: "serial_number",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
          {
            name: "event_type",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Images retrieved successfully",
          },
        },
      },
    },
    "/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard data",
        description: "Retrieve comprehensive dashboard data for a user",
        parameters: [
          {
            name: "clerk_id",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "User ID from Clerk authentication",
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
        },
      },
    },
    "/devices": {
      get: {
        tags: ["Dashboard"],
        summary: "List user devices",
        parameters: [
          {
            name: "clerk_id",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "name",
            in: "query",
            schema: { type: "string" },
            description: "Filter by device name",
          },
          {
            name: "is_active",
            in: "query",
            schema: { type: "boolean" },
          },
        ],
        responses: {
          "200": {
            description: "Devices retrieved successfully",
          },
        },
      },
      post: {
        tags: ["Dashboard"],
        summary: "Create new device",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clerk_id", "email", "name"],
                properties: {
                  clerk_id: { type: "string" },
                  email: { type: "string", format: "email" },
                  name: { type: "string" },
                  location: { type: "string" },
                  serial_number: { type: "string" },
                  is_active: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Device created successfully",
          },
        },
      },
    },
    "/events": {
      get: {
        tags: ["Events"],
        summary: "Get events",
        parameters: [
          {
            name: "device_id",
            in: "query",
            schema: { type: "integer" },
          },
          {
            name: "clerk_id",
            in: "query",
            schema: { type: "string" },
          },
          {
            name: "event_type",
            in: "query",
            schema: {
              type: "string",
              enum: ["open", "close", "delivery", "removal"],
            },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
          },
        ],
        responses: {
          "200": {
            description: "Events retrieved successfully",
          },
        },
      },
      post: {
        tags: ["Events"],
        summary: "Create event",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["device_id", "event_type", "clerk_id"],
                properties: {
                  device_id: { type: "integer" },
                  event_type: {
                    type: "string",
                    enum: ["open", "close", "delivery", "removal"],
                  },
                  clerk_id: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Event created successfully",
          },
        },
      },
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get notifications",
        parameters: [
          {
            name: "clerk_id",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "device_id",
            in: "query",
            schema: { type: "integer" },
          },
          {
            name: "is_read",
            in: "query",
            schema: { type: "boolean" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
          },
        ],
        responses: {
          "200": {
            description: "Notifications retrieved successfully",
          },
        },
      },
    },
    "/init-db": {
      post: {
        tags: ["Database"],
        summary: "Initialize database",
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
    // Return HTML Swagger UI
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mail Guard API Documentation</title>
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
      const ui = SwaggerUIBundle({
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

  // Return JSON OpenAPI spec
  return NextResponse.json(API_DOCS, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
