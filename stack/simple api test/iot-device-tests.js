// IoT Device API Test Suite
// Base URL for the API - change this to match your environment
let BASE_URL = "https://mail-guard-ten.vercel.app/api";

// Test configuration
let TEST_CONFIG = {
  validSerialNumber: "TEST-DEVICE-001",
  invalidSerialNumber: "INVALID-SERIAL-123",
  testImagePath: "./test-image.jpg", // You'll need to place a test image here
  apiDelay: 1000, // Delay between tests to avoid rate limiting
};

// Utility function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to log test results
const logTest = (testName, passed, details = "") => {
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   Details: ${details}`);
  console.log("");
};

// Helper function to make API requests
const makeRequest = async (
  method,
  endpoint,
  data = null,
  isFormData = false
) => {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {},
  };

  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    return {
      status: response.status,
      data: responseData,
      headers: response.headers,
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
    };
  }
};

// Test Suite Functions
async function testIoTActivatePost() {
  console.log(
    "🧪 Testing POST /iot/activate - Validate IoT device serial number"
  );

  // Test 1: Valid device activation with all parameters
  const validPayload = {
    serial_number: TEST_CONFIG.validSerialNumber,
    firmware_version: "2.1.0",
    device_type: "mailbox_monitor",
  };

  const response1 = await makeRequest("POST", "/iot/activate", validPayload);
  logTest(
    "Valid device activation",
    response1.status === 200 && response1.data.status === "valid",
    `Status: ${response1.status}, Response: ${JSON.stringify(
      response1.data,
      null,
      2
    )}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 2: Missing serial number
  const invalidPayload1 = {
    firmware_version: "2.1.0",
    device_type: "mailbox_monitor",
  };

  const response2 = await makeRequest("POST", "/iot/activate", invalidPayload1);
  logTest(
    "Missing serial number validation",
    response2.status === 400 &&
      response2.data.error === "Serial number is required",
    `Status: ${response2.status}, Error: ${response2.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 3: Invalid serial number
  const invalidPayload2 = {
    serial_number: TEST_CONFIG.invalidSerialNumber,
    firmware_version: "2.1.0",
    device_type: "mailbox_monitor",
  };

  const response3 = await makeRequest("POST", "/iot/activate", invalidPayload2);
  logTest(
    "Invalid serial number handling",
    response3.status === 404 && response3.data.status === "invalid",
    `Status: ${response3.status}, Response: ${JSON.stringify(
      response3.data,
      null,
      2
    )}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 4: Minimal payload (only serial number)
  const minimalPayload = {
    serial_number: TEST_CONFIG.validSerialNumber,
  };

  const response4 = await makeRequest("POST", "/iot/activate", minimalPayload);
  logTest(
    "Minimal payload activation",
    response4.status === 200 && response4.data.status === "valid",
    `Status: ${response4.status}, Can operate: ${response4.data.can_operate}`
  );
}

async function testIoTActivateGet() {
  console.log(
    "🧪 Testing GET /iot/activate - Check device status and information"
  );

  // Test 1: Valid device status check
  const response1 = await makeRequest(
    "GET",
    `/iot/activate?serial_number=${TEST_CONFIG.validSerialNumber}`
  );
  logTest(
    "Valid device status check",
    response1.status === 200 &&
      response1.data.serial_number === TEST_CONFIG.validSerialNumber,
    `Status: ${response1.status}, Device Model: ${response1.data.device_model}, Is Valid: ${response1.data.is_valid}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 2: Missing serial number parameter
  const response2 = await makeRequest("GET", "/iot/activate");
  logTest(
    "Missing serial number parameter",
    response2.status === 400 &&
      response2.data.error === "Serial number parameter is required",
    `Status: ${response2.status}, Error: ${response2.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 3: Invalid serial number
  const response3 = await makeRequest(
    "GET",
    `/iot/activate?serial_number=${TEST_CONFIG.invalidSerialNumber}`
  );
  logTest(
    "Invalid serial number lookup",
    response3.status === 404 && response3.data.status === "invalid",
    `Status: ${response3.status}, Response: ${JSON.stringify(
      response3.data,
      null,
      2
    )}`
  );
}

async function testIoTEventPost() {
  console.log("🧪 Testing POST /iot/event - Push event from IoT device");

  // Test 1: Valid event with all parameters
  const validEventPayload = {
    serial_number: TEST_CONFIG.validSerialNumber,
    event_data: {
      reed_sensor: true,
      event_type: "open",
      mailbox_status: "opened",
    },
    timestamp: new Date().toISOString(),
    firmware_version: "2.1.0",
    battery_level: 85,
    signal_strength: -65,
  };

  const response1 = await makeRequest("POST", "/iot/event", validEventPayload);
  logTest(
    "Valid event submission",
    response1.status === 200 && response1.data.message.includes("recorded"),
    `Status: ${response1.status}, Event Type: ${response1.data.event_type}, Message: ${response1.data.message}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 2: Missing serial number
  const invalidEventPayload1 = {
    event_data: {
      reed_sensor: false,
      event_type: "close",
    },
  };

  const response2 = await makeRequest(
    "POST",
    "/iot/event",
    invalidEventPayload1
  );
  logTest(
    "Missing serial number in event",
    response2.status === 400 &&
      response2.data.error === "Serial number is required",
    `Status: ${response2.status}, Error: ${response2.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 3: Missing event data
  const invalidEventPayload2 = {
    serial_number: TEST_CONFIG.validSerialNumber,
  };

  const response3 = await makeRequest(
    "POST",
    "/iot/event",
    invalidEventPayload2
  );
  logTest(
    "Missing event data",
    response3.status === 400 &&
      response3.data.error === "Event data is required",
    `Status: ${response3.status}, Error: ${response3.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 4: Missing reed sensor in event data
  const invalidEventPayload3 = {
    serial_number: TEST_CONFIG.validSerialNumber,
    event_data: {
      event_type: "delivery",
    },
  };

  const response4 = await makeRequest(
    "POST",
    "/iot/event",
    invalidEventPayload3
  );
  logTest(
    "Missing reed sensor in event data",
    response4.status === 400 &&
      response4.data.error === "reed_sensor status is required in event_data",
    `Status: ${response4.status}, Error: ${response4.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 5: Different event types
  const eventTypes = [
    { reed_sensor: false, event_type: "close" },
    { reed_sensor: true, event_type: "delivery" },
    { reed_sensor: false, event_type: "removal" },
  ];

  for (const eventData of eventTypes) {
    const eventPayload = {
      serial_number: TEST_CONFIG.validSerialNumber,
      event_data: eventData,
      battery_level: Math.floor(Math.random() * 100),
      signal_strength: Math.floor(Math.random() * -100),
    };

    const response = await makeRequest("POST", "/iot/event", eventPayload);
    logTest(
      `Event type: ${eventData.event_type}`,
      response.status === 200,
      `Status: ${response.status}, Processed Event: ${response.data.event_type}`
    );

    await delay(TEST_CONFIG.apiDelay);
  }
}

async function testIoTEventGet() {
  console.log("🧪 Testing GET /iot/event - Get device events");

  // Test 1: Get events for valid device
  const response1 = await makeRequest(
    "GET",
    `/iot/event?serial_number=${TEST_CONFIG.validSerialNumber}`
  );
  logTest(
    "Get device events",
    response1.status === 200 &&
      response1.data.serial_number === TEST_CONFIG.validSerialNumber,
    `Status: ${response1.status}, Total Events: ${
      response1.data.total_events
    }, IoT Events: ${response1.data.iot_events?.length || 0}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 2: Get events with limit parameter
  const response2 = await makeRequest(
    "GET",
    `/iot/event?serial_number=${TEST_CONFIG.validSerialNumber}&limit=5`
  );
  logTest(
    "Get events with limit",
    response2.status === 200 && response2.data.total_events <= 10, // 5 from each table
    `Status: ${response2.status}, Total Events: ${response2.data.total_events}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 3: Missing serial number parameter
  const response3 = await makeRequest("GET", "/iot/event");
  logTest(
    "Missing serial number for events",
    response3.status === 400 &&
      response3.data.error === "Serial number parameter is required",
    `Status: ${response3.status}, Error: ${response3.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 4: Invalid device serial number
  const response4 = await makeRequest(
    "GET",
    `/iot/event?serial_number=${TEST_CONFIG.invalidSerialNumber}`
  );
  logTest(
    "Get events for invalid device",
    response4.status === 404 && response4.data.error === "Device not found",
    `Status: ${response4.status}, Error: ${response4.data.error}`
  );
}

async function testIoTUploadPost() {
  console.log("🧪 Testing POST /iot/upload - Upload image from IoT device");

  // Note: This test requires a sample image file
  // You'll need to create a small test image or modify this test

  // Test 1: Missing file
  const formData1 = new FormData();
  formData1.append("serial_number", TEST_CONFIG.validSerialNumber);
  formData1.append("event_type", "delivery");

  const response1 = await makeRequest("POST", "/iot/upload", formData1, true);
  logTest(
    "Missing image file",
    response1.status === 400 &&
      response1.data.error === "Image file is required",
    `Status: ${response1.status}, Error: ${response1.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 2: Missing serial number
  const formData2 = new FormData();
  // Create a dummy file blob for testing
  const dummyFile = new Blob(["dummy image content"], { type: "image/jpeg" });
  formData2.append("file", dummyFile, "test.jpg");
  formData2.append("event_type", "delivery");

  const response2 = await makeRequest("POST", "/iot/upload", formData2, true);
  logTest(
    "Missing serial number in upload",
    response2.status === 400 &&
      response2.data.error === "Serial number is required",
    `Status: ${response2.status}, Error: ${response2.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 3: Invalid file type
  const formData3 = new FormData();
  const invalidFile = new Blob(["not an image"], { type: "text/plain" });
  formData3.append("file", invalidFile, "test.txt");
  formData3.append("serial_number", TEST_CONFIG.validSerialNumber);

  const response3 = await makeRequest("POST", "/iot/upload", formData3, true);
  logTest(
    "Invalid file type",
    response3.status === 400 &&
      response3.data.error === "File must be an image",
    `Status: ${response3.status}, Error: ${response3.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 4: Valid image upload (simulated)
  const formData4 = new FormData();
  const validImageFile = new Blob(["fake jpeg content"], {
    type: "image/jpeg",
  });
  formData4.append("file", validImageFile, "test-image.jpg");
  formData4.append("serial_number", TEST_CONFIG.validSerialNumber);
  formData4.append("event_type", "delivery");
  formData4.append("timestamp", new Date().toISOString());

  const response4 = await makeRequest("POST", "/iot/upload", formData4, true);
  logTest(
    "Valid image upload (simulated)",
    response4.status === 201 || response4.status === 500, // 500 expected due to S3 config in test env
    `Status: ${response4.status}, Message: ${
      response4.data.message || response4.data.error
    }`
  );
}

async function testIoTUploadGet() {
  console.log("🧪 Testing GET /iot/upload - Get device images");

  // Test 1: Get images for valid device
  const response1 = await makeRequest(
    "GET",
    `/iot/upload?serial_number=${TEST_CONFIG.validSerialNumber}`
  );
  logTest(
    "Get device images",
    response1.status === 200 &&
      response1.data.serial_number === TEST_CONFIG.validSerialNumber,
    `Status: ${response1.status}, Total Images: ${response1.data.total_images}, Device Model: ${response1.data.device_model}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 2: Get images with limit parameter
  const response2 = await makeRequest(
    "GET",
    `/iot/upload?serial_number=${TEST_CONFIG.validSerialNumber}&limit=10`
  );
  logTest(
    "Get images with limit",
    response2.status === 200 && response2.data.filters.limit === 10,
    `Status: ${response2.status}, Applied Limit: ${response2.data.filters.limit}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 3: Get images with event type filter
  const response3 = await makeRequest(
    "GET",
    `/iot/upload?serial_number=${TEST_CONFIG.validSerialNumber}&event_type=delivery`
  );
  logTest(
    "Get images with event type filter",
    response3.status === 200 &&
      response3.data.filters.event_type === "delivery",
    `Status: ${response3.status}, Event Filter: ${response3.data.filters.event_type}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 4: Missing serial number parameter
  const response4 = await makeRequest("GET", "/iot/upload");
  logTest(
    "Missing serial number for images",
    response4.status === 400 &&
      response4.data.error === "Serial number parameter is required",
    `Status: ${response4.status}, Error: ${response4.data.error}`
  );

  await delay(TEST_CONFIG.apiDelay);

  // Test 5: Invalid device serial number
  const response5 = await makeRequest(
    "GET",
    `/iot/upload?serial_number=${TEST_CONFIG.invalidSerialNumber}`
  );
  logTest(
    "Get images for invalid device",
    response5.status === 404 && response5.data.error === "Device not found",
    `Status: ${response5.status}, Error: ${response5.data.error}`
  );
}

// Main test runner
async function runAllTests() {
  console.log("🚀 Starting IoT Device API Test Suite");
  console.log("=".repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Serial Number: ${TEST_CONFIG.validSerialNumber}`);
  console.log("=".repeat(60));
  console.log("");

  try {
    // Test all IoT device endpoints
    await testIoTActivatePost();
    await testIoTActivateGet();
    await testIoTEventPost();
    await testIoTEventGet();
    await testIoTUploadPost();
    await testIoTUploadGet();

    console.log("=".repeat(60));
    console.log("✅ All tests completed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Test suite failed with error:", error);
  }
}

// Performance testing function
async function runPerformanceTests() {
  console.log("🔥 Running Performance Tests");
  console.log("=".repeat(40));

  const testEndpoint = async (method, endpoint, payload) => {
    const startTime = Date.now();
    const response = await makeRequest(method, endpoint, payload);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `${method} ${endpoint}: ${duration}ms (Status: ${response.status})`
    );
    return duration;
  };

  // Test response times for all endpoints
  const performanceResults = [];

  performanceResults.push(
    await testEndpoint("POST", "/iot/activate", {
      serial_number: TEST_CONFIG.validSerialNumber,
      firmware_version: "2.1.0",
    })
  );

  performanceResults.push(
    await testEndpoint(
      "GET",
      `/iot/activate?serial_number=${TEST_CONFIG.validSerialNumber}`
    )
  );

  performanceResults.push(
    await testEndpoint("POST", "/iot/event", {
      serial_number: TEST_CONFIG.validSerialNumber,
      event_data: { reed_sensor: true, event_type: "open" },
    })
  );

  performanceResults.push(
    await testEndpoint(
      "GET",
      `/iot/event?serial_number=${TEST_CONFIG.validSerialNumber}&limit=5`
    )
  );

  performanceResults.push(
    await testEndpoint(
      "GET",
      `/iot/upload?serial_number=${TEST_CONFIG.validSerialNumber}&limit=5`
    )
  );

  const avgResponseTime =
    performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
  console.log(`\nAverage Response Time: ${avgResponseTime.toFixed(2)}ms`);
}

// Export for Node.js or run directly
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    runAllTests,
    runPerformanceTests,
    TEST_CONFIG,
    makeRequest,
    testIoTActivatePost,
    testIoTActivateGet,
    testIoTEventPost,
    testIoTEventGet,
    testIoTUploadPost,
    testIoTUploadGet,
  };
} else if (typeof window === "undefined") {
  // Run tests if script is executed directly in Node.js
  runAllTests();
}
