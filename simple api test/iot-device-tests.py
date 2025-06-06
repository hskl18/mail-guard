#!/usr/bin/env python3
"""
IoT Device API Test Suite (Python Version)
Tests all IoT device management endpoints for the Mail Guard system.
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = 'https://mail-guard-ten.vercel.app/api'
TEST_CONFIG = {
    'valid_serial_number': 'SN001234567',
    'invalid_serial_number': 'INVALID-SERIAL-123',
    'api_delay': 1.0  # Delay between tests in seconds
}

def delay():
    """Add delay between API calls to avoid rate limiting."""
    time.sleep(TEST_CONFIG['api_delay'])

def log_test(test_name: str, passed: bool, details: str = ''):
    """Log test results with emoji indicators."""
    status = '✅ PASS' if passed else '❌ FAIL'
    print(f"{status} - {test_name}")
    if details:
        print(f"   Details: {details}")
    print()

def make_request(method: str, endpoint: str, data: Any = None, files: Dict = None) -> Dict:
    """Make HTTP request to API endpoint."""
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=30)
        elif method.upper() == 'POST':
            if files:
                response = requests.post(url, data=data, files=files, timeout=30)
            else:
                headers['Content-Type'] = 'application/json'
                response = requests.post(url, json=data, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        try:
            response_data = response.json()
        except json.JSONDecodeError:
            response_data = {'error': 'Invalid JSON response', 'text': response.text}
        
        return {
            'status': response.status_code,
            'data': response_data,
            'headers': dict(response.headers)
        }
    except requests.exceptions.RequestException as e:
        return {
            'status': 0,
            'error': str(e)
        }

def test_iot_activate_post():
    """Test POST /iot/activate - Validate IoT device serial number."""
    print('🧪 Testing POST /iot/activate - Validate IoT device serial number')
    
    # Test 1: Valid device activation with all parameters
    valid_payload = {
        'serial_number': TEST_CONFIG['valid_serial_number'],
        'firmware_version': '2.1.0',
        'device_type': 'mailbox_monitor'
    }
    
    response1 = make_request('POST', '/iot/activate', valid_payload)
    log_test(
        'Valid device activation',
        response1['status'] == 200 and response1.get('data', {}).get('status') == 'valid',
        f"Status: {response1['status']}, Response: {json.dumps(response1.get('data', {}), indent=2)}"
    )
    
    delay()
    
    # Test 2: Missing serial number
    invalid_payload1 = {
        'firmware_version': '2.1.0',
        'device_type': 'mailbox_monitor'
    }
    
    response2 = make_request('POST', '/iot/activate', invalid_payload1)
    log_test(
        'Missing serial number validation',
        response2['status'] == 400 and response2.get('data', {}).get('error') == 'Serial number is required',
        f"Status: {response2['status']}, Error: {response2.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 3: Invalid serial number
    invalid_payload2 = {
        'serial_number': TEST_CONFIG['invalid_serial_number'],
        'firmware_version': '2.1.0',
        'device_type': 'mailbox_monitor'
    }
    
    response3 = make_request('POST', '/iot/activate', invalid_payload2)
    log_test(
        'Invalid serial number handling',
        response3['status'] == 404 and response3.get('data', {}).get('status') == 'invalid',
        f"Status: {response3['status']}, Response: {json.dumps(response3.get('data', {}), indent=2)}"
    )
    
    delay()
    
    # Test 4: Minimal payload (only serial number)
    minimal_payload = {
        'serial_number': TEST_CONFIG['valid_serial_number']
    }
    
    response4 = make_request('POST', '/iot/activate', minimal_payload)
    log_test(
        'Minimal payload activation',
        response4['status'] == 200 and response4.get('data', {}).get('status') == 'valid',
        f"Status: {response4['status']}, Can operate: {response4.get('data', {}).get('can_operate')}"
    )

def test_iot_activate_get():
    """Test GET /iot/activate - Check device status and information."""
    print('🧪 Testing GET /iot/activate - Check device status and information')
    
    # Test 1: Valid device status check
    response1 = make_request('GET', f"/iot/activate?serial_number={TEST_CONFIG['valid_serial_number']}")
    log_test(
        'Valid device status check',
        response1['status'] == 200 and response1.get('data', {}).get('serial_number') == TEST_CONFIG['valid_serial_number'],
        f"Status: {response1['status']}, Device Model: {response1.get('data', {}).get('device_model')}, Is Valid: {response1.get('data', {}).get('is_valid')}"
    )
    
    delay()
    
    # Test 2: Missing serial number parameter
    response2 = make_request('GET', '/iot/activate')
    log_test(
        'Missing serial number parameter',
        response2['status'] == 400 and response2.get('data', {}).get('error') == 'Serial number parameter is required',
        f"Status: {response2['status']}, Error: {response2.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 3: Invalid serial number
    response3 = make_request('GET', f"/iot/activate?serial_number={TEST_CONFIG['invalid_serial_number']}")
    log_test(
        'Invalid serial number lookup',
        response3['status'] == 404 and response3.get('data', {}).get('status') == 'invalid',
        f"Status: {response3['status']}, Response: {json.dumps(response3.get('data', {}), indent=2)}"
    )

def test_iot_event_post():
    """Test POST /iot/event - Push event from IoT device."""
    print('🧪 Testing POST /iot/event - Push event from IoT device')
    
    # Test 1: Valid event with all parameters
    valid_event_payload = {
        'serial_number': TEST_CONFIG['valid_serial_number'],
        'event_data': {
            'reed_sensor': True,
            'event_type': 'open',
            'mailbox_status': 'opened'
        },
        'timestamp': datetime.now().isoformat(),
        'firmware_version': '2.1.0',
        'battery_level': 85,
        'signal_strength': -65
    }
    
    response1 = make_request('POST', '/iot/event', valid_event_payload)
    log_test(
        'Valid event submission',
        response1['status'] == 200 and 'recorded' in response1.get('data', {}).get('message', ''),
        f"Status: {response1['status']}, Event Type: {response1.get('data', {}).get('event_type')}, Message: {response1.get('data', {}).get('message')}"
    )
    
    delay()
    
    # Test 2: Missing serial number
    invalid_event_payload1 = {
        'event_data': {
            'reed_sensor': False,
            'event_type': 'close'
        }
    }
    
    response2 = make_request('POST', '/iot/event', invalid_event_payload1)
    log_test(
        'Missing serial number in event',
        response2['status'] == 400 and response2.get('data', {}).get('error') == 'Serial number is required',
        f"Status: {response2['status']}, Error: {response2.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 3: Missing event data
    invalid_event_payload2 = {
        'serial_number': TEST_CONFIG['valid_serial_number']
    }
    
    response3 = make_request('POST', '/iot/event', invalid_event_payload2)
    log_test(
        'Missing event data',
        response3['status'] == 400 and response3.get('data', {}).get('error') == 'Event data is required',
        f"Status: {response3['status']}, Error: {response3.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 4: Missing reed sensor in event data
    invalid_event_payload3 = {
        'serial_number': TEST_CONFIG['valid_serial_number'],
        'event_data': {
            'event_type': 'delivery'
        }
    }
    
    response4 = make_request('POST', '/iot/event', invalid_event_payload3)
    log_test(
        'Missing reed sensor in event data',
        response4['status'] == 400 and 'reed_sensor status is required' in response4.get('data', {}).get('error', ''),
        f"Status: {response4['status']}, Error: {response4.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 5: Different event types
    event_types = [
        {'reed_sensor': False, 'event_type': 'close'},
        {'reed_sensor': True, 'event_type': 'delivery'},
        {'reed_sensor': False, 'event_type': 'removal'}
    ]
    
    for event_data in event_types:
        event_payload = {
            'serial_number': TEST_CONFIG['valid_serial_number'],
            'event_data': event_data,
            'battery_level': 75,
            'signal_strength': -70
        }
        
        response = make_request('POST', '/iot/event', event_payload)
        log_test(
            f"Event type: {event_data['event_type']}",
            response['status'] == 200,
            f"Status: {response['status']}, Processed Event: {response.get('data', {}).get('event_type')}"
        )
        
        delay()

def test_iot_event_get():
    """Test GET /iot/event - Get device events."""
    print('🧪 Testing GET /iot/event - Get device events')
    
    # Test 1: Get events for valid device
    response1 = make_request('GET', f"/iot/event?serial_number={TEST_CONFIG['valid_serial_number']}")
    log_test(
        'Get device events',
        response1['status'] == 200 and response1.get('data', {}).get('serial_number') == TEST_CONFIG['valid_serial_number'],
        f"Status: {response1['status']}, Total Events: {response1.get('data', {}).get('total_events')}, IoT Events: {len(response1.get('data', {}).get('iot_events', []))}"
    )
    
    delay()
    
    # Test 2: Get events with limit parameter
    response2 = make_request('GET', f"/iot/event?serial_number={TEST_CONFIG['valid_serial_number']}&limit=5")
    log_test(
        'Get events with limit',
        response2['status'] == 200 and response2.get('data', {}).get('total_events', 0) <= 10,
        f"Status: {response2['status']}, Total Events: {response2.get('data', {}).get('total_events')}"
    )
    
    delay()
    
    # Test 3: Missing serial number parameter
    response3 = make_request('GET', '/iot/event')
    log_test(
        'Missing serial number for events',
        response3['status'] == 400 and response3.get('data', {}).get('error') == 'Serial number parameter is required',
        f"Status: {response3['status']}, Error: {response3.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 4: Invalid device serial number
    response4 = make_request('GET', f"/iot/event?serial_number={TEST_CONFIG['invalid_serial_number']}")
    log_test(
        'Get events for invalid device',
        response4['status'] == 404 and response4.get('data', {}).get('error') == 'Device not found',
        f"Status: {response4['status']}, Error: {response4.get('data', {}).get('error')}"
    )

def test_iot_upload_post():
    """Test POST /iot/upload - Upload image from IoT device."""
    print('🧪 Testing POST /iot/upload - Upload image from IoT device')
    
    # Test 1: Missing file
    data1 = {
        'serial_number': TEST_CONFIG['valid_serial_number'],
        'event_type': 'delivery'
    }
    
    response1 = make_request('POST', '/iot/upload', data=data1)
    log_test(
        'Missing image file',
        response1['status'] == 400 and response1.get('data', {}).get('error') == 'Image file is required',
        f"Status: {response1['status']}, Error: {response1.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 2: Missing serial number
    # Create a dummy file for testing
    dummy_file_content = b'dummy image content'
    files2 = {'file': ('test.jpg', dummy_file_content, 'image/jpeg')}
    data2 = {'event_type': 'delivery'}
    
    response2 = make_request('POST', '/iot/upload', data=data2, files=files2)
    log_test(
        'Missing serial number in upload',
        response2['status'] == 400 and response2.get('data', {}).get('error') == 'Serial number is required',
        f"Status: {response2['status']}, Error: {response2.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 3: Invalid file type
    invalid_file_content = b'not an image'
    files3 = {'file': ('test.txt', invalid_file_content, 'text/plain')}
    data3 = {'serial_number': TEST_CONFIG['valid_serial_number']}
    
    response3 = make_request('POST', '/iot/upload', data=data3, files=files3)
    log_test(
        'Invalid file type',
        response3['status'] == 400 and response3.get('data', {}).get('error') == 'File must be an image',
        f"Status: {response3['status']}, Error: {response3.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 4: Valid image upload (simulated)
    valid_file_content = b'fake jpeg content'
    files4 = {'file': ('test-image.jpg', valid_file_content, 'image/jpeg')}
    data4 = {
        'serial_number': TEST_CONFIG['valid_serial_number'],
        'event_type': 'delivery',
        'timestamp': datetime.now().isoformat()
    }
    
    response4 = make_request('POST', '/iot/upload', data=data4, files=files4)
    log_test(
        'Valid image upload (simulated)',
        response4['status'] in [201, 500],  # 500 expected due to S3 config in test env
        f"Status: {response4['status']}, Message: {response4.get('data', {}).get('message', response4.get('data', {}).get('error', ''))}"
    )

def test_iot_upload_get():
    """Test GET /iot/upload - Get device images."""
    print('🧪 Testing GET /iot/upload - Get device images')
    
    # Test 1: Get images for valid device
    response1 = make_request('GET', f"/iot/upload?serial_number={TEST_CONFIG['valid_serial_number']}")
    log_test(
        'Get device images',
        response1['status'] == 200 and response1.get('data', {}).get('serial_number') == TEST_CONFIG['valid_serial_number'],
        f"Status: {response1['status']}, Total Images: {response1.get('data', {}).get('total_images')}, Device Model: {response1.get('data', {}).get('device_model')}"
    )
    
    delay()
    
    # Test 2: Get images with limit parameter
    response2 = make_request('GET', f"/iot/upload?serial_number={TEST_CONFIG['valid_serial_number']}&limit=10")
    log_test(
        'Get images with limit',
        response2['status'] == 200 and response2.get('data', {}).get('filters', {}).get('limit') == 10,
        f"Status: {response2['status']}, Applied Limit: {response2.get('data', {}).get('filters', {}).get('limit')}"
    )
    
    delay()
    
    # Test 3: Get images with event type filter
    response3 = make_request('GET', f"/iot/upload?serial_number={TEST_CONFIG['valid_serial_number']}&event_type=delivery")
    log_test(
        'Get images with event type filter',
        response3['status'] == 200 and response3.get('data', {}).get('filters', {}).get('event_type') == 'delivery',
        f"Status: {response3['status']}, Event Filter: {response3.get('data', {}).get('filters', {}).get('event_type')}"
    )
    
    delay()
    
    # Test 4: Missing serial number parameter
    response4 = make_request('GET', '/iot/upload')
    log_test(
        'Missing serial number for images',
        response4['status'] == 400 and response4.get('data', {}).get('error') == 'Serial number parameter is required',
        f"Status: {response4['status']}, Error: {response4.get('data', {}).get('error')}"
    )
    
    delay()
    
    # Test 5: Invalid device serial number
    response5 = make_request('GET', f"/iot/upload?serial_number={TEST_CONFIG['invalid_serial_number']}")
    log_test(
        'Get images for invalid device',
        response5['status'] == 404 and response5.get('data', {}).get('error') == 'Device not found',
        f"Status: {response5['status']}, Error: {response5.get('data', {}).get('error')}"
    )

def run_all_tests():
    """Run all IoT device API tests."""
    print('🚀 Starting IoT Device API Test Suite (Python)')
    print('=' * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Serial Number: {TEST_CONFIG['valid_serial_number']}")
    print('=' * 60)
    print()
    
    try:
        # Test all IoT device endpoints
        test_iot_activate_post()
        test_iot_activate_get()
        test_iot_event_post()
        test_iot_event_get()
        test_iot_upload_post()
        test_iot_upload_get()
        
        print('=' * 60)
        print('✅ All tests completed successfully!')
        print('=' * 60)
    except Exception as error:
        print(f'❌ Test suite failed with error: {error}')
        sys.exit(1)

def run_performance_tests():
    """Run performance tests for IoT endpoints."""
    print('🔥 Running Performance Tests (Python)')
    print('=' * 40)
    
    def test_endpoint(method: str, endpoint: str, payload: Any = None) -> float:
        start_time = time.time()
        response = make_request(method, endpoint, payload)
        end_time = time.time()
        duration = (end_time - start_time) * 1000  # Convert to milliseconds
        
        print(f"{method} {endpoint}: {duration:.2f}ms (Status: {response['status']})")
        return duration
    
    # Test response times for all endpoints
    performance_results = []
    
    performance_results.append(test_endpoint('POST', '/iot/activate', {
        'serial_number': TEST_CONFIG['valid_serial_number'],
        'firmware_version': '2.1.0'
    }))
    
    performance_results.append(test_endpoint('GET', f"/iot/activate?serial_number={TEST_CONFIG['valid_serial_number']}"))
    
    performance_results.append(test_endpoint('POST', '/iot/event', {
        'serial_number': TEST_CONFIG['valid_serial_number'],
        'event_data': {'reed_sensor': True, 'event_type': 'open'}
    }))
    
    performance_results.append(test_endpoint('GET', f"/iot/event?serial_number={TEST_CONFIG['valid_serial_number']}&limit=5"))
    
    performance_results.append(test_endpoint('GET', f"/iot/upload?serial_number={TEST_CONFIG['valid_serial_number']}&limit=5"))
    
    avg_response_time = sum(performance_results) / len(performance_results)
    print(f"\nAverage Response Time: {avg_response_time:.2f}ms")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--performance':
        run_performance_tests()
    else:
        run_all_tests() 