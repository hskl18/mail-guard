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
                        enum: [
                          "open",
                          "close",
                          "delivery",
                          "removal",
                          "item_detected",
                          "weight_change",
                        ],
                        description: "Type of mailbox event",
                        example: "open",
                      },
                      mailbox_status: {
                        type: "string",
                        description: "Human readable status",
                        example: "opened",
                      },
                      weight_sensor: {
                        type: "boolean",
                        description: "Whether weight sensor is present/active",
                        example: true,
                      },
                      weight_value: {
                        type: "number",
                        format: "float",
                        description: "Current weight reading in grams",
                        example: 125.5,
                        minimum: 0,
                      },
                      weight_threshold: {
                        type: "number",
                        format: "float",
                        description:
                          "Weight change threshold in grams for item detection (default: 50g)",
                        example: 50,
                        minimum: 1,
                        default: 50,
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
                    detection_method: {
                      type: "string",
                      enum: ["reed_sensor", "weight_sensor", "explicit"],
                      description: "Method used to detect the event",
                    },
                    device_id: { type: "integer" },
                    serial_number: { type: "string" },
                    status: {
                      type: "string",
                      enum: ["claimed_device", "unclaimed_device"],
                    },
                    weight_data: {
                      type: "object",
                      nullable: true,
                      description: "Weight sensor data (if available)",
                      properties: {
                        current_weight: {
                          type: "number",
                          format: "float",
                          description: "Current weight reading in grams",
                        },
                        last_weight: {
                          type: "number",
                          format: "float",
                          nullable: true,
                          description: "Previous weight reading in grams",
                        },
                        weight_change: {
                          type: "number",
                          format: "float",
                          nullable: true,
                          description: "Change in weight since last reading",
                        },
                        item_detected: {
                          type: "boolean",
                          description:
                            "Whether weight change exceeded threshold",
                        },
                        threshold_used: {
                          type: "number",
                          format: "float",
                          description: "Weight threshold used for detection",
                        },
                      },
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
                        weight_value: {
                          type: "number",
                          format: "float",
                          nullable: true,
                          description: "Current weight reading in grams",
                        },
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mail Guard IoT API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVDiNpZNrSFNhGMefczabzjlv005nnbdpF8+8TVPMIi8RJhZFRQQhRWBfiiA=">
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    #swagger-ui {
      max-width: 1200px;
      margin: 0 auto;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 18px;
      color: #666;
    }
    .error {
      padding: 20px;
      margin: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
    }
    .fallback {
      padding: 20px;
      margin: 20px;
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      border-radius: 4px;
      color: #0c5460;
    }
    .fallback a {
      color: #0c5460;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div id="loading" class="loading">Loading API Documentation...</div>
  <div id="swagger-ui"></div>
  <div id="fallback" class="fallback" style="display: none;">
    <h3>📚 Alternative Documentation Access</h3>
    <p>If the interactive documentation doesn't load, you can:</p>
    <ul>
      <li><a href="/api/docs?format=json" target="_blank">📄 View Raw JSON Schema</a></li>
      <li><a href="https://editor.swagger.io/" target="_blank">🔧 Open Swagger Editor</a> and paste the JSON</li>
      <li><a href="https://petstore.swagger.io/?url=${encodeURIComponent(
        window.location.origin + "/api/docs?format=json"
      )}" target="_blank">🌐 View in Swagger Petstore</a></li>
    </ul>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js" crossorigin></script>
  
  <script>
    window.onload = function() {
      const loadingEl = document.getElementById('loading');
      const fallbackEl = document.getElementById('fallback');
      
      try {
        // Show loading initially
        loadingEl.style.display = 'flex';
        
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
          layout: "StandaloneLayout",
          tryItOutEnabled: true,
          filter: true,
          supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
          onComplete: function() {
            loadingEl.style.display = 'none';
            console.log('✅ Mail Guard API Documentation loaded successfully');
          },
          onFailure: function(err) {
            console.error('❌ Failed to load API documentation:', err);
            loadingEl.style.display = 'none';
            fallbackEl.style.display = 'block';
          }
        });
        
        // Fallback timeout
        setTimeout(function() {
          if (loadingEl.style.display !== 'none') {
            console.warn('⏰ Documentation loading timeout, showing fallback options');
            loadingEl.style.display = 'none';
            fallbackEl.style.display = 'block';
          }
        }, 10000); // 10 second timeout
        
      } catch (error) {
        console.error('❌ Error initializing Swagger UI:', error);
        loadingEl.style.display = 'none';
        fallbackEl.style.display = 'block';
      }
    };
    
    // Handle script loading errors
    window.addEventListener('error', function(e) {
      if (e.target.tagName === 'SCRIPT') {
        console.error('❌ Failed to load Swagger UI scripts:', e.target.src);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('fallback').style.display = 'block';
      }
    });
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
