# Mail Guard API

This directory contains the Next.js API routes for the Mail Guard IoT application.

## Core Data Flow

**IoT Device → HTTP API → User Dashboard**

1. IoT devices send events via HTTP to `/api/iot/event`
2. Users connect devices through `/api/iot/activate` validation
3. Dashboard displays IoT data via `/api/dashboard`

## Essential API Endpoints

### 🌐 IoT Device APIs (Core)

- **`POST /api/iot/event`** - **[MAIN]** Receive events from IoT devices (mailbox open/close, delivery, etc.)
- **`GET /api/iot/activate?serial_number={serial}`** - Validate device serial numbers for connection
- **`POST /api/iot/upload`** - Handle file uploads from IoT devices
- **`POST /api/iot/report`** - Receive status reports from IoT devices

### 📱 Device Management APIs

- **`POST /api/devices`** - Create device record when user connects IoT device
- **`GET /api/devices/{id}?clerk_id={clerk_id}`** - Get specific device details
- **`DELETE /api/devices/{id}?clerk_id={clerk_id}`** - Remove device from user account

### 📊 Dashboard API

- **`GET /api/dashboard?clerk_id={clerk_id}`** - Get user's IoT data including:
  - Connected devices
  - Recent events from IoT devices
  - Recent images from IoT devices
  - Notification count

### 🔧 Setup APIs

- **`POST /api/init-db`** - Initialize database with required tables
- **`GET /api/docs`** - API documentation

## IoT Event Types Supported

- `open` - Mailbox opened (reed sensor triggered)
- `close` - Mailbox closed (reed sensor released)
- `delivery` - Mail delivered (inferred from reed sensor, weight sensor, or explicit)
- `removal` - Mail removed (inferred from reed sensor, weight sensor, or explicit)
- `item_detected` - Item detected via weight sensor (maps to delivery)
- `weight_change` - Weight change detected (maps to delivery/removal based on direction)

## Detection Methods

- **Reed Sensor**: Traditional magnetic switch detection for open/close events
- **Weight Sensor**: Load cell/weight-based detection for item delivery/removal
  - Configurable weight threshold (default: 50g)
  - Automatic item detection based on weight changes
  - Positive weight change = delivery event
  - Negative weight change = removal event
- **Explicit Events**: Manually specified event types from IoT device logic

## IoT Device Data Flow

1. **Device Activation**: User validates serial number via `/api/iot/activate`
2. **Device Connection**: User creates device record via `/api/devices`
3. **Event Streaming**: IoT device sends real-time events to `/api/iot/event`
4. **Dashboard Display**: User sees IoT data via `/api/dashboard`

## Environment Variables

```env
# Database Configuration
MYSQL_HOST=your-database-host.com
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mailguard_db

# AWS S3 Configuration for IoT Image Storage
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET=your-bucket-name

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Database Tables

### Core IoT Tables

- `device_serials` - Valid IoT device serial numbers
- `iot_device_status` - Real-time IoT device status and health
- `iot_events` - Events from unclaimed IoT devices
- `devices` - User-claimed IoT devices
- `events` - Events from claimed IoT devices
- `images` - Images from IoT devices
- `device_health` - IoT device health metrics
- `notifications` - User notifications from IoT events

## IoT Integration Details

### Event Processing

- Validates device serial numbers against `device_serials` table
- Updates device health metrics (battery, signal strength, firmware)
- Routes events to appropriate tables based on device claim status
- Generates notifications for important events (delivery, open)

### Device Health Monitoring

- Battery level tracking
- Signal strength monitoring
- Firmware version management
- Last seen timestamps
- Online/offline status

### Security

- Serial number validation prevents unauthorized devices
- Clerk authentication for user data access
- Device ownership validation through `clerk_id`
