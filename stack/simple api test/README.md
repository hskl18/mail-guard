# IoT Device API Test Suite

This directory contains comprehensive test suites for the **Mail Guard IoT Device Management API**. The tests cover all six IoT device endpoints for device activation, event management, and image upload functionality.

## 📋 Table of Contents

- [Overview](#overview)
- [API Endpoints Tested](#api-endpoints-tested)
- [Test Files](#test-files)
- [Setup & Requirements](#setup--requirements)
- [Running Tests](#running-tests)
- [Test Configuration](#test-configuration)
- [Test Categories](#test-categories)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## 🔍 Overview

The Mail Guard IoT Device Management API provides endpoints for IoT devices to communicate with the backend system. These tests ensure all endpoints work correctly with various input scenarios including valid data, missing parameters, invalid data, and edge cases.

**Base API URL**: `https://mail-guard-ten.vercel.app/api`

## 🚀 API Endpoints Tested

### Device Activation

- **POST /iot/activate** - Validate IoT device serial number
- **GET /iot/activate** - Check device status and information

### Event Management

- **POST /iot/event** - Push event from IoT device
- **GET /iot/event** - Get device events

### Image Upload

- **POST /iot/upload** - Upload image from IoT device
- **GET /iot/upload** - Get device images

## 📁 Test Files

```
simple api test/
├── iot-device-tests.js    # JavaScript/Node.js test suite
├── iot-device-tests.py    # Python test suite
├── README.md              # This documentation
└── requirements.txt       # Python dependencies
```

## ⚙️ Setup & Requirements

### JavaScript Version (Node.js)

**Requirements:**

- Node.js 14+
- Modern browser with fetch API support (for browser usage)

**Dependencies:**

```bash
# No external dependencies required - uses built-in fetch API
```

### Python Version

**Requirements:**

- Python 3.7+
- `requests` library

**Installation:**

```bash
# Install dependencies
pip install -r requirements.txt

# Or install manually
pip install requests
```

## 🏃‍♂️ Running Tests

### JavaScript Tests

**Node.js:**

```bash
cd "simple api test"
node iot-device-tests.js
```

**Browser:**

```html
<!-- Include the script in an HTML file -->
<script src="iot-device-tests.js"></script>
```

### Python Tests

**Standard Tests:**

```bash
cd "simple api test"
python iot-device-tests.py
```

**Performance Tests:**

```bash
python iot-device-tests.py --performance
```

**Make executable (Linux/Mac):**

```bash
chmod +x iot-device-tests.py
./iot-device-tests.py
```

## ⚙️ Test Configuration

Both test suites use the following default configuration:

```javascript
// JavaScript
const TEST_CONFIG = {
  validSerialNumber: "TEST-DEVICE-001",
  invalidSerialNumber: "INVALID-SERIAL-123",
  testImagePath: "./test-image.jpg",
  apiDelay: 1000, // ms
};
```

```python
# Python
TEST_CONFIG = {
    'valid_serial_number': 'TEST-DEVICE-001',
    'invalid_serial_number': 'INVALID-SERIAL-123',
    'api_delay': 1.0  # seconds
}
```

**To customize:**

1. Edit the `TEST_CONFIG` object in the test file
2. Change `BASE_URL` to test against different environments
3. Modify serial numbers based on your test data

## 🧪 Test Categories

### 1. Device Activation Tests

**POST /iot/activate**

- ✅ Valid device activation with all parameters
- ✅ Missing serial number validation
- ✅ Invalid serial number handling
- ✅ Minimal payload (serial number only)

**GET /iot/activate**

- ✅ Valid device status check
- ✅ Missing serial number parameter
- ✅ Invalid serial number lookup

### 2. Event Management Tests

**POST /iot/event**

- ✅ Valid event submission with all parameters
- ✅ Missing serial number validation
- ✅ Missing event data validation
- ✅ Missing reed sensor validation
- ✅ Different event types (open, close, delivery, removal)

**GET /iot/event**

- ✅ Get events for valid device
- ✅ Get events with limit parameter
- ✅ Missing serial number parameter
- ✅ Invalid device serial number

### 3. Image Upload Tests

**POST /iot/upload**

- ✅ Missing image file validation
- ✅ Missing serial number validation
- ✅ Invalid file type validation
- ✅ Valid image upload (simulated)

**GET /iot/upload**

- ✅ Get images for valid device
- ✅ Get images with limit parameter
- ✅ Get images with event type filter
- ✅ Missing serial number parameter
- ✅ Invalid device serial number

## 📖 API Documentation

### Authentication

Currently, the IoT endpoints do not require authentication, but device serial numbers must be valid and registered in the system.

### Request/Response Examples

**Device Activation:**

```bash
# POST /iot/activate
curl -X POST https://mail-guard-ten.vercel.app/api/iot/activate \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "TEST-DEVICE-001",
    "firmware_version": "2.1.0",
    "device_type": "mailbox_monitor"
  }'

# Response
{
  "message": "Device serial number validated",
  "serial_number": "TEST-DEVICE-001",
  "status": "valid",
  "is_claimed": false,
  "device_model": "MailGuard Pro V2",
  "can_operate": true,
  "last_seen": "2024-01-15T10:30:00.000Z"
}
```

**Event Submission:**

```bash
# POST /iot/event
curl -X POST https://mail-guard-ten.vercel.app/api/iot/event \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "TEST-DEVICE-001",
    "event_data": {
      "reed_sensor": true,
      "event_type": "open",
      "mailbox_status": "opened"
    },
    "firmware_version": "2.1.0",
    "battery_level": 85,
    "signal_strength": -65
  }'

# Response
{
  "message": "IoT event recorded (unclaimed device)",
  "iot_event_id": 123,
  "event_type": "open",
  "serial_number": "TEST-DEVICE-001",
  "status": "unclaimed",
  "processed_at": "2024-01-15T10:30:00.000Z"
}
```

**Image Upload:**

```bash
# POST /iot/upload
curl -X POST https://mail-guard-ten.vercel.app/api/iot/upload \
  -F "file=@image.jpg" \
  -F "serial_number=TEST-DEVICE-001" \
  -F "event_type=delivery"

# Response
{
  "message": "IoT image uploaded successfully (no dashboard device linked)",
  "iot_image_id": 456,
  "image_url": "https://s3.amazonaws.com/bucket/iot-images/...",
  "serial_number": "TEST-DEVICE-001",
  "event_type": "delivery",
  "file_size": 245760,
  "captured_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Troubleshooting

### Common Issues

**❌ Connection Errors**

```
Error: Failed to fetch / Connection timeout
```

- Check internet connection
- Verify API URL is accessible
- Check if API server is running

**❌ Authentication Errors**

```
Status: 403 - Forbidden
```

- Verify API endpoints don't require authentication
- Check if IP address is whitelisted (if applicable)

**❌ Invalid Serial Number**

```
Status: 404 - Invalid serial number
```

- Use valid test serial numbers
- Check if test devices are registered in the system
- Update `TEST_CONFIG` with valid serial numbers

**❌ File Upload Errors**

```
Status: 500 - Failed to upload image to storage
```

- Expected behavior in test environment (S3 not configured)
- Check file size limits (10MB max)
- Verify file is valid image format

### Debug Mode

**JavaScript:**

```javascript
// Enable detailed logging
const response = await makeRequest("POST", "/iot/activate", payload);
console.log("Full Response:", response);
```

**Python:**

```python
# Enable detailed logging
response = make_request('POST', '/iot/activate', payload)
print(f"Full Response: {json.dumps(response, indent=2)}")
```

### Performance Considerations

- API has built-in rate limiting
- Tests include delays between requests (1 second default)
- Average response time should be < 2000ms
- Use performance test mode to monitor response times

## 🤝 Contributing

To add new tests or improve existing ones:

1. **Add new test functions** following the naming pattern `test_iot_*`
2. **Update test runner** to include new test functions
3. **Add documentation** for new test scenarios
4. **Test both JavaScript and Python** versions
5. **Update this README** with new test descriptions

## 📝 License

This test suite is part of the Mail Guard project. Please refer to the main project license.

---

**Last Updated:** January 2024  
**API Version:** v1  
**Test Suite Version:** 1.0.0
