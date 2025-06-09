#!/usr/bin/env python3
"""
IoT Quick Test Generator
Simple test script for Mail Guard IoT device testing
Generates 4 core events: delivery (with image), open, removal, close
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta

# python3 test_iot_data.py

class IoTDataGenerator:
    def __init__(self, serial_number=None, base_url="http://localhost:3000"):
    # def __init__(self, serial_number=None, base_url="https://mail-guard-ten.vercel.app"):
        # Use a specific default serial number for testing
        self.serial_number = serial_number or "6666666666"
        self.base_url = base_url
        self.demo_image_path = "demo.jpg"
        
        # Device simulation state
        self.battery_level = random.randint(80, 100)
        self.is_online = True
        self.last_event_time = datetime.now()
        self.current_weight = 0.0  # Weight sensor state
        
        print(f"🚀 IoT Quick Test for device: {self.serial_number}")
        print(f"🌐 Target API: {self.base_url}")

    def send_event(self, event_type=None, add_image=False, verbose=True, weight_data=None):
        """Send a single IoT event with optional weight sensor data"""
        if not event_type:
            event_type = random.choice(['open', 'close', 'delivery', 'removal'])
        
        # Simulate device state changes
        self.battery_level = max(10, self.battery_level - random.randint(0, 2))
        signal_strength = random.randint(-90, -30)
        
        # Create event data in the format expected by the API
        reed_sensor = event_type in ['open', 'delivery']  # True for open events
        mailbox_status = "opened" if reed_sensor else "closed"
        
        event_data_payload = {
            'reed_sensor': reed_sensor,
            'event_type': event_type,
            'mailbox_status': mailbox_status
        }
        
        # Add weight sensor data if provided
        if weight_data:
            event_data_payload.update({
                'weight_sensor': True,
                'weight_value': weight_data.get('weight_value', 0.0),
                'weight_threshold': weight_data.get('weight_threshold', 50)
            })
            if weight_data.get('weight_value') is not None:
                self.current_weight = weight_data['weight_value']
        
        event_data = {
            'serial_number': self.serial_number,
            'event_data': event_data_payload,
            'battery_level': self.battery_level,
            'signal_strength': signal_strength,
            'firmware_version': '1.2.3' if not weight_data else '2.0.0-weight',
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/iot/event",
                json=event_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                event_id = result.get('event_id', result.get('iot_event_id', 'unknown'))
                status = result.get('status', 'unknown')
                detection_method = result.get('detection_method', 'unknown')
                weight_result = result.get('weight_data', {})
                
                if verbose:
                    # Check if this event should trigger email notifications
                    email_events = ['delivery', 'open', 'removal']
                    email_note = ""
                    if event_type in email_events and status == "claimed_device":
                        email_note = " 📧 (Email notification sent if enabled)"
                    elif event_type in email_events and status in ["unclaimed", "claimed_but_not_linked"]:
                        email_note = " ⚠️ (No email - device not fully claimed)"
                    
                    weight_info = ""
                    if weight_result:
                        change = weight_result.get('weight_change')
                        detected = weight_result.get('item_detected', False)
                        if change is not None:
                            change_text = f"+{change}g" if change > 0 else f"{change}g"
                            weight_info = f" | Weight: {weight_result.get('current_weight', 0)}g ({change_text}) {'✓' if detected else '✗'}"
                    
                    print(f"✅ {event_type.upper()} event sent (ID: {event_id}, Method: {detection_method}){weight_info}{email_note}")
                
                # Upload image only for delivery events (mail delivered)
                if add_image and event_type == 'delivery':
                    time.sleep(0.5)  # Small delay
                    self.upload_image(event_type)
                
                return True, result
            else:
                try:
                    error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                    error_msg = error_data.get('error', f"HTTP {response.status_code}")
                    print(f"❌ Event failed: {error_msg}")
                    
                    # Print additional error details if available
                    if error_data.get('message'):
                        print(f"   Details: {error_data.get('message')}")
                    
                    # Special handling for common errors
                    if response.status_code == 404:
                        print(f"💡 Tip: Device serial '{self.serial_number}' not found. Create device first or use existing serial.")
                    elif response.status_code == 400:
                        print(f"💡 Tip: Check the event data format - there might be missing or invalid fields.")
                        if verbose:
                            print(f"   Sent data: {json.dumps(event_data, indent=2)}")
                except json.JSONDecodeError:
                    print(f"❌ Event failed: HTTP {response.status_code}")
                    print(f"   Raw response: {response.text[:200]}...")
                    
                return False, None
                
        except Exception as e:
            print(f"❌ Event error: {e}")
            return False, None



    def upload_image(self, event_type="delivery"):
        """Upload a demo image - only for delivery events"""
        try:
            with open(self.demo_image_path, 'rb') as img_file:
                files = {'file': ('demo.jpg', img_file, 'image/jpeg')}
                data = {
                    'serial_number': self.serial_number,
                    'event_type': event_type,
                    'timestamp': datetime.now().isoformat()
                }
                
                response = requests.post(
                    f"{self.base_url}/api/iot/upload",
                    files=files,
                    data=data,
                    timeout=15
                )
                
                if response.status_code == 201:
                    result = response.json()
                    image_id = result.get('image_id', result.get('iot_image_id', 'unknown'))
                    print(f"📸 Image uploaded (ID: {image_id})")
                    return True, result
                else:
                    print(f"❌ Image upload failed: {response.status_code}")
                    return False, None
                    
        except Exception as e:
            print(f"❌ Image upload error: {e}")
            return False, None



    def test_minimal_events(self):
        """Generate one of each core event type - simplified test"""
        print(f"\n📬 Testing Core Events (Minimal)")
        print("=" * 40)
        
        events_created = 0
        images_uploaded = 0
        
        # Core events - one of each type
        core_events = [
            ('delivery', '📬 Mail delivered (with image & email)'),
            ('open', '📭 Mailbox opened (email only)'),
            ('removal', '📮 Mail removed (email only)'),
            ('close', '📫 Mailbox closed'),
        ]
        
        for event_type, description in core_events:
            print(f"\n{description}")
            
            # Only delivery events get images
            add_image = (event_type == 'delivery')
            success, result = self.send_event(event_type, add_image=add_image, verbose=True)
            
            if success:
                events_created += 1
                if add_image:
                    images_uploaded += 1
            
            time.sleep(1)  # Brief pause between events
        
        print(f"\n📊 Test Summary:")
        print(f"   ✅ Events Created: {events_created}/4")
        print(f"   📸 Images Uploaded: {images_uploaded}")
        print(f"   🔋 Battery Level: {self.battery_level}%")
        print(f"   📧 Email notifications sent for delivery/open/removal events (if enabled)")
        
        return events_created, images_uploaded


        
    def check_device_status(self):
        """Check if the device exists and is properly configured"""
        print(f"\n🔍 Checking device status for: {self.serial_number}")
        
        try:
            # Check via activate endpoint for full status including weight
            response = requests.get(
                f"{self.base_url}/api/iot/activate",
                params={'serial_number': self.serial_number},
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if not data:
                        print(f"❌ Empty response from server")
                        return False
                        
                    status = data.get('status') if data else None
                    
                    print(f"✅ Device Status:")
                    print(f"   Serial: {data.get('serial_number', 'N/A')}")
                    print(f"   Valid: {data.get('is_valid', 'N/A')}")
                    print(f"   Claimed: {data.get('is_claimed', 'N/A')}")
                    print(f"   Dashboard Linked: {data.get('dashboard_linked', 'N/A')}")
                    
                    if status:
                        print(f"   Online: {status.get('is_online', 'Unknown')}")
                        print(f"   Weight: {status.get('weight_value', 'No data')}g")
                        print(f"   Battery: {status.get('battery_level', 'Unknown')}%")
                        print(f"   Signal: {status.get('signal_strength', 'Unknown')}dBm")
                        print(f"   Last Seen: {status.get('last_seen', 'Unknown')}")
                    else:
                        print(f"   Status: No device status available (device may not be online)")
                        
                    print(f"   Model: {data.get('device_model', 'Unknown')}")
                    return True
                    
                except json.JSONDecodeError as e:
                    print(f"❌ Invalid JSON response: {e}")
                    print(f"Raw response: {response.text[:200]}...")
                    return False
                    
            elif response.status_code == 404:
                print(f"❌ Device not found: {self.serial_number}")
                print("💡 You may need to create this device first or use an existing serial number")
                return False
            else:
                print(f"⚠️ Unable to check device status: HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error details: {error_data.get('error', 'Unknown error')}")
                except:
                    print(f"Raw error response: {response.text[:200]}...")
                return None
                
        except Exception as e:
            print(f"❌ Error checking device: {e}")
            return None

def main():
    """Main function for running quick IoT test"""
    print("🎯 IoT Quick Test - Core Events!")
    print("=" * 35)
    
    # Use the default serial number for testing
    generator = IoTDataGenerator("6666666666")
    
    # Run the test
    events, images = generator.test_minimal_events()
    
    print(f"\n🎉 Test completed!")
    print(f"📍 Check dashboard: http://localhost:3000/dashboard")
    print(f"📧 Check your email for delivery notification with image!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--check":
            # Check device status
            serial = sys.argv[2] if len(sys.argv) > 2 else "6666666666"
            generator = IoTDataGenerator(serial)
            generator.check_device_status()
        else:
            print("Usage:")
            print("  python3 test_iot_data.py                        # Run quick test (4 core events)")
            print("  python3 test_iot_data.py --check [SN]           # Check device status")
            print("  [SN] = Serial Number (optional, defaults to 6666666666)")
            print("  📸 Note: Only delivery events include images in emails")
    else:
        main() 