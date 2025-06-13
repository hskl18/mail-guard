# MailGuard API Testing Suite

Comprehensive testing utilities for validating the MailGuard API endpoints, security features, and IoT device integration.

---

## 📁 Test Suite Structure

```
api_test/
├── test_iot_data.py          # Main IoT API testing script (304 lines)
├── demo.jpg                  # Sample image for upload testing (3.7KB)
└── README.md                 # This documentation
```

---

## 🧪 Test Scripts

### **test_iot_data.py** - IoT API Integration Tests

**Purpose**: Comprehensive testing of all IoT device endpoints with security validation.

**Features**:

- ✅ **Authentication Testing**: API key validation and error handling
- ✅ **Event Submission**: Complete IoT event workflow testing
- ✅ **Image Upload**: Photo upload with various formats and sizes
- ✅ **Rate Limiting**: Validation of rate limiting enforcement
- ✅ **Error Scenarios**: Network failures, malformed data, unauthorized access
- ✅ **Device Registration**: IoT device activation and validation
- ✅ **Security Events**: Authentication failure and security logging tests

#### **Test Categories**

1. **Basic Connectivity Tests**

   - API availability and health checks
   - CORS header validation
   - Response time measurements

2. **Authentication Tests**

   - Valid API key authentication
   - Invalid API key rejection
   - Missing authentication header handling
   - Different authentication methods (Bearer, X-API-Key, query param)

3. **Event Submission Tests**

   - Standard event formats (open, close, delivery, removal)
   - Weight sensor integration
   - Battery level reporting
   - Signal strength monitoring
   - Event type inference validation

4. **Image Upload Tests**

   - JPEG image upload validation
   - File size limit testing
   - Invalid file format rejection
   - Multipart form data handling

5. **Rate Limiting Tests**

   - Normal usage within limits
   - Rate limit threshold testing
   - Rate limit enforcement validation
   - Different limits for different API key types

6. **Error Handling Tests**

   - Malformed JSON payloads
   - Missing required fields
   - Invalid data types
   - Network timeout scenarios

7. **Security Tests**
   - SQL injection attempt detection
   - XSS payload validation
   - Input sanitization verification
   - Security event logging validation

---

## 🚀 Running Tests

### **Prerequisites**

- Python 3.8+
- `requests` library
- Valid API endpoint (local or production)
- IoT API key for authenticated tests

### **Setup**

```bash
# 1. Navigate to test directory
cd api_test

# 2. Install dependencies
pip install requests Pillow

# 3. Configure test environment
export API_BASE_URL="https://mail-guard-ten.vercel.app"
export IOT_API_KEY="iot_your_test_api_key_here"

# Alternative: Edit test script directly
# API_BASE_URL = "https://mail-guard-ten.vercel.app"
# IOT_API_KEY = "iot_your_test_api_key_here"
```

### **Running All Tests**

```bash
# Run complete test suite
python test_iot_data.py

# Expected output:
# ✅ Testing IoT API endpoints...
# ✅ Authentication tests passed
# ✅ Event submission tests passed
# ✅ Image upload tests passed
# ✅ Rate limiting tests passed
# ✅ Error handling tests passed
# ✅ Security tests passed
# 📊 Test Summary: X/Y tests passed
```

### **Running Specific Test Categories**

```bash
# Run only authentication tests
python test_iot_data.py --test-auth

# Run only event submission tests
python test_iot_data.py --test-events

# Run only image upload tests
python test_iot_data.py --test-images

# Run security-focused tests
python test_iot_data.py --test-security
```

---

## 🔧 Test Configuration

### **Environment Variables**

```bash
# Required
export API_BASE_URL="https://your-api-domain.com"
export IOT_API_KEY="iot_your_device_api_key"

# Optional
export TEST_SERIAL_NUMBER="TEST001234567"
export TEST_TIMEOUT=30
export VERBOSE_OUTPUT=true
export SKIP_RATE_LIMIT_TESTS=false
```

### **Test Script Configuration**

Edit `test_iot_data.py` for custom configurations:

```python
# Test Configuration
CONFIG = {
    "api_base_url": "https://mail-guard-ten.vercel.app",
    "iot_api_key": "iot_your_test_key_here",
    "test_serial": "TEST001234567",
    "timeout": 30,
    "verbose": True,
    "test_rate_limits": True,
    "test_image_upload": True,
    "max_retries": 3
}
```

---

## 📊 Test Coverage

### **API Endpoints Tested**

#### **IoT Device Endpoints**

- ✅ `POST /api/iot/event` - Event submission with full validation
- ✅ `POST /api/iot/upload` - Image upload with security checks
- ✅ `POST /api/iot/activate` - Device registration workflow
- ✅ `GET /api/iot/report` - Legacy reporting endpoint

#### **Authentication Methods**

- ✅ `Authorization: Bearer {token}` header
- ✅ `X-API-Key: {key}` header
- ✅ `?api_key={key}` query parameter

#### **Security Features**

- ✅ Rate limiting enforcement
- ✅ Input validation and sanitization
- ✅ Error handling and logging
- ✅ CORS header validation
- ✅ Security event logging

### **Test Scenarios**

#### **Happy Path Tests** ✅

- Valid authentication
- Proper request formats
- Normal usage patterns
- Expected response codes

#### **Error Path Tests** ✅

- Invalid authentication
- Malformed requests
- Rate limit violations
- Server error handling

#### **Security Tests** ✅

- Injection attack attempts
- Authentication bypass attempts
- Rate limit enforcement
- Input validation edge cases

#### **Performance Tests** ✅

- Response time measurements
- Concurrent request handling
- Large payload processing
- Image upload performance

---

## 📝 Test Results & Reporting

### **Console Output Format**

```
🧪 MailGuard API Test Suite
============================

🔐 Authentication Tests
  ✅ Valid API key accepted
  ✅ Invalid API key rejected
  ✅ Missing API key handled
  ✅ Multiple auth methods tested

📡 Event Submission Tests
  ✅ Basic event format accepted
  ✅ Weight sensor data processed
  ✅ Battery level reported
  ✅ Event type inference working

📸 Image Upload Tests
  ✅ JPEG upload successful
  ✅ File size validation working
  ✅ Invalid format rejected

🛡️ Security Tests
  ✅ Rate limiting enforced
  ✅ Input validation working
  ✅ SQL injection blocked
  ✅ Security events logged

📊 Test Summary
================
Total Tests: 45
Passed: 43
Failed: 2
Warnings: 3
Duration: 2.5 minutes
```

### **Detailed Test Report**

Each test generates detailed information:

- **Request/Response data**
- **Performance metrics**
- **Error analysis**
- **Security validation results**

---

## 🔍 Debugging & Troubleshooting

### **Common Issues**

#### **Authentication Failures**

```
❌ Error: 401 Unauthorized
Solution: Check API key format and validity
- Ensure key starts with 'iot_'
- Verify key is active in database
- Check spelling and formatting
```

#### **Connection Timeouts**

```
❌ Error: Request timeout
Solution: Check network connectivity and API availability
- Verify API_BASE_URL is correct
- Check firewall/proxy settings
- Test with curl: curl -I https://your-api-domain.com
```

#### **Rate Limit Errors**

```
❌ Error: 429 Too Many Requests
Solution: Wait for rate limit reset or use different API key
- Default IoT limit: 100 requests/hour
- Check rate limit headers in response
- Implement exponential backoff
```

### **Verbose Debug Mode**

Enable detailed debug output:

```python
# Set verbose mode in test script
VERBOSE = True

# Or set environment variable
export VERBOSE_OUTPUT=true
```

Debug output includes:

- Complete HTTP request/response data
- Timing information
- Intermediate processing steps
- Error stack traces

---

## 🚀 Continuous Integration

### **GitHub Actions Integration**

Create `.github/workflows/api-tests.yml`:

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.9"
      - name: Install dependencies
        run: |
          cd api_test
          pip install requests Pillow
      - name: Run API tests
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          IOT_API_KEY: ${{ secrets.IOT_API_KEY }}
        run: |
          cd api_test
          python test_iot_data.py
```

### **Pre-deployment Testing**

```bash
# Test before deployment
./api_test/test_iot_data.py --quick
# Deploy only if tests pass
if [ $? -eq 0 ]; then
  echo "✅ API tests passed - proceeding with deployment"
  # Your deployment commands here
else
  echo "❌ API tests failed - aborting deployment"
  exit 1
fi
```

---

## 📚 Test Development Guide

### **Adding New Tests**

1. **Create test function**:

   ```python
   def test_new_feature():
       """Test description"""
       # Test implementation
       assert response.status_code == 200
       return True
   ```

2. **Add to test runner**:

   ```python
   test_functions = [
       test_authentication,
       test_event_submission,
       test_new_feature,  # Add here
   ]
   ```

3. **Include validation**:
   - Request format validation
   - Response schema validation
   - Security checks
   - Performance measurements

### **Test Best Practices**

- ✅ **Isolation**: Each test should be independent
- ✅ **Cleanup**: Clean up test data after tests
- ✅ **Assertions**: Clear pass/fail criteria
- ✅ **Documentation**: Document test purpose and expectations
- ✅ **Error Handling**: Graceful handling of test failures

---

## 📞 Support

### **Test Failures**

1. **Check API availability**: Verify the API endpoint is accessible
2. **Validate API keys**: Ensure test API keys are valid and active
3. **Review logs**: Check both test output and API server logs
4. **Network issues**: Test basic connectivity with curl/ping

### **Contributing Tests**

1. **Fork repository** and create feature branch
2. **Add test cases** following existing patterns
3. **Test thoroughly** with various scenarios
4. **Submit pull request** with test documentation

### **Getting Help**

- **Documentation**: See main README and API docs
- **GitHub Issues**: Report test failures and bugs
- **Discord/Forum**: Community support for testing issues

---

**🧪 Comprehensive testing ensures reliable and secure IoT device integration!**
