#!/usr/bin/env python3
"""
IoT Fake Data Generator
Generate realistic fake data for IoT device testing and development
Now includes email notification testing and weight sensor functionality!
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta

# python3 test_iot_data.py --quick 6666666666
# python3 test_iot_data.py --weight-test 6666666666

class IoTDataGenerator:
    def __init__(self, serial_number=None, base_url="http://localhost:3000"):
        # Use a more realistic default serial number
        self.serial_number = serial_number or f"TEST_DEVICE_{random.randint(1000, 9999)}"
        self.base_url = base_url
        self.demo_image_path = "demo.jpg"
        
        # Device simulation state
        self.battery_level = random.randint(80, 100)
        self.is_online = True
        self.last_event_time = datetime.now()
        self.current_weight = 0.0  # Weight sensor state
        
        print(f"🚀 IoT Data Generator for device: {self.serial_number}")
        print(f"🌐 Target API: {self.base_url}")
        print(f"📧 Email notifications will be tested if device is claimed and user email available in Clerk")
        print(f"⚖️ Weight sensor functionality included")

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
                
                # Upload image for certain events
                if add_image and event_type in ['open', 'delivery']:
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

    def send_weight_event(self, weight_value, event_type=None, threshold=50, verbose=True):
        """Send weight sensor event to IoT API"""
        weight_data = {
            'weight_value': weight_value,
            'weight_threshold': threshold
        }
        
        # If no event type specified, let the API infer from weight change
        return self.send_event(event_type, add_image=False, verbose=verbose, weight_data=weight_data)

    def simulate_mail_delivery_scenario(self):
        """Simulate a complete mail delivery scenario with weight sensor"""
        print(f"\n📬 === MAIL DELIVERY SIMULATION (Weight Sensor) ===")
        print("Scenario: Small letter (25g) and package (180g) delivered")
        
        print(f"\n1️⃣ Initial state - Empty mailbox")
        self.send_weight_event(0.0)
        time.sleep(2)
        
        print(f"\n2️⃣ Small letter delivered (+25g) - Below threshold")
        self.send_weight_event(25.0)
        time.sleep(2)
        
        print(f"\n3️⃣ Package delivered (+180g) - Above threshold")
        self.send_weight_event(205.0)  # 25g letter + 180g package
        time.sleep(2)
        
        print(f"\n4️⃣ Letter removed (-25g) - Below threshold")
        self.send_weight_event(180.0)
        time.sleep(2)
        
        print(f"\n5️⃣ Package removed (-180g) - Above threshold")
        self.send_weight_event(0.0)
        
    def test_custom_thresholds(self):
        """Test different weight thresholds"""
        print(f"\n⚖️ === CUSTOM THRESHOLD TESTING ===")
        
        scenarios = [
            {"weight": 30.0, "threshold": 25, "expected": "detected"},
            {"weight": 20.0, "threshold": 25, "expected": "not detected"},
            {"weight": 100.0, "threshold": 75, "expected": "detected"},
            {"weight": 15.0, "threshold": 10, "expected": "detected"},
        ]
        
        # Start with empty mailbox
        self.send_weight_event(0.0, verbose=False)
        time.sleep(1)
        
        for i, scenario in enumerate(scenarios, 1):
            print(f"\n{i}️⃣ Testing: {scenario['weight']}g with {scenario['threshold']}g threshold")
            print(f"   Expected: {scenario['expected']}")
            self.send_weight_event(
                scenario['weight'], 
                threshold=scenario['threshold']
            )
            time.sleep(1.5)
    
    def test_explicit_weight_events(self):
        """Test explicit weight-based event types"""
        print(f"\n🎯 === EXPLICIT WEIGHT EVENT TESTING ===")
        
        # Reset to empty
        self.send_weight_event(0.0, verbose=False)
        time.sleep(1)
        
        print(f"\n1️⃣ Explicit 'item_detected' event")
        self.send_weight_event(75.0, event_type="item_detected")
        time.sleep(2)
        
        print(f"\n2️⃣ Explicit 'weight_change' event")
        self.send_weight_event(150.0, event_type="weight_change")
        time.sleep(2)
        
        print(f"\n3️⃣ Explicit 'delivery' with weight data")
        self.send_weight_event(200.0, event_type="delivery")
        time.sleep(2)
        
        print(f"\n4️⃣ Explicit 'removal' with weight data")
        self.send_weight_event(50.0, event_type="removal")

    def test_weight_sensor_full_suite(self):
        """Run all weight sensor tests"""
        print(f"\n🧪 === WEIGHT SENSOR TEST SUITE ===")
        print(f"=" * 50)
        
        # Check initial device status
        self.check_device_status()
        
        # Run weight sensor test scenarios
        self.simulate_mail_delivery_scenario()
        time.sleep(3)
        
        self.test_custom_thresholds()
        time.sleep(3)
        
        self.test_explicit_weight_events()
        time.sleep(2)
        
        print(f"\n✅ Weight sensor testing completed!")
        print(f"📊 Check your dashboard to see the weight-detected events")

    def upload_image(self, event_type="general"):
        """Upload a demo image"""
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

    def test_email_notifications(self):
        """Specifically test email notification events"""
        print(f"\n📧 Testing Email Notification Events")
        print("=" * 50)
        print("This will send events that should trigger email notifications:")
        print("- Mail delivery (if mail_delivered_notify enabled)")
        print("- Mailbox opened (if mailbox_opened_notify enabled)")
        print("- Mail removal (if mail_removed_notify enabled)")
        print()
        print("📋 Email Architecture:")
        print("- Email address: Retrieved from Clerk user profile (primaryEmailAddress)")
        print("- Notification preferences: Stored in devices table")
        print("- API: Uses clerkClient().users.getUser(clerkId) to get email")
        print()
        print("✅ Emails will only be sent if:")
        print("- Device is claimed and linked to dashboard")
        print("- User has email_notifications enabled")
        print("- User has specific event notifications enabled")
        print("- User has valid email address in Clerk profile (primaryEmailAddress)")
        print()
        
        email_test_events = [
            ('delivery', '📬 Testing mail delivery notification'),
            ('open', '📭 Testing mailbox opened notification'),
            ('removal', '📮 Testing mail removal notification'),
        ]
        
        successes = 0
        for event_type, description in email_test_events:
            print(f"\n{description}")
            success, result = self.send_event(event_type, add_image=True, verbose=True)
            if success:
                successes += 1
            time.sleep(2)  # Give time for email processing
        
        print(f"\n📊 Email Test Summary:")
        print(f"   Events sent: {successes}/{len(email_test_events)}")
        print(f"   Battery level: {self.battery_level}%")
        print(f"\n💡 Check your email (from Clerk profile) and server logs to confirm email delivery!")
        
        return successes

    def generate_daily_activity(self, num_events=10, include_weight=False):
        """Generate a realistic day of mailbox activity"""
        print(f"\n📬 Generating {num_events} events for daily activity...")
        if include_weight:
            print("⚖️ Including weight sensor data in events")
        
        events_created = 0
        images_uploaded = 0
        
        # Typical daily sequence with email-triggering events
        daily_events = [
            ('delivery', '📬 Morning mail delivery (Email trigger)'),
            ('open', '📭 Check mail after work (Email trigger)'),
            ('removal', '📮 Take mail out (Email trigger)'),
            ('close', '📫 Close mailbox'),
        ]
        
        # Send typical sequence first
        for event_type, description in daily_events:
            print(f"\n📋 {description}")
            
            weight_data = None
            if include_weight:
                # Simulate realistic weight changes
                if event_type == 'delivery':
                    weight_data = {'weight_value': self.current_weight + random.uniform(50, 200), 'weight_threshold': 50}
                elif event_type == 'removal':
                    weight_data = {'weight_value': max(0, self.current_weight - random.uniform(30, 150)), 'weight_threshold': 50}
                else:
                    weight_data = {'weight_value': self.current_weight, 'weight_threshold': 50}
            
            success, result = self.send_event(event_type, add_image=True, weight_data=weight_data)
            if success:
                events_created += 1
                if event_type in ['delivery', 'open']:
                    images_uploaded += 1
            time.sleep(1)
        
        # Fill remaining with random events
        remaining = max(0, num_events - len(daily_events))
        for i in range(remaining):
            print(f"\n🎲 Random event {i+1}/{remaining}")
            event_type = random.choice(['open', 'close', 'delivery', 'removal'])
            add_image = random.random() < 0.3  # 30% chance of image
            
            weight_data = None
            if include_weight:
                # Random weight variations
                if event_type == 'delivery':
                    weight_data = {'weight_value': self.current_weight + random.uniform(20, 100), 'weight_threshold': 50}
                elif event_type == 'removal':
                    weight_data = {'weight_value': max(0, self.current_weight - random.uniform(20, 80)), 'weight_threshold': 50}
                else:
                    weight_data = {'weight_value': self.current_weight + random.uniform(-5, 5), 'weight_threshold': 50}
            
            success, result = self.send_event(event_type, add_image, weight_data=weight_data)
            if success:
                events_created += 1
                if add_image:
                    images_uploaded += 1
            time.sleep(0.5)
        
        print(f"\n📊 Generation Summary:")
        print(f"   Events Created: {events_created}")
        print(f"   Images Uploaded: {images_uploaded}")
        print(f"   Battery Level: {self.battery_level}%")
        print(f"   Current Weight: {self.current_weight}g" if include_weight else "")
        print(f"   📧 Email notifications sent for delivery/open/removal events (if enabled)")
        
        return events_created, images_uploaded

    def simulate_device_activity(self, duration_minutes=5, include_weight=False):
        """Simulate continuous device activity for testing"""
        print(f"\n⏱️  Simulating device activity for {duration_minutes} minutes...")
        print("This includes email notification events mixed with regular activity.")
        if include_weight:
            print("⚖️ Weight sensor data will be included")
        
        end_time = datetime.now() + timedelta(minutes=duration_minutes)
        events_sent = 0
        email_events_sent = 0
        
        while datetime.now() < end_time:
            # Random event every 30-120 seconds
            wait_time = random.randint(30, 120)
            
            # Higher chance of email-triggering events for testing
            email_events = ['delivery', 'open', 'removal']
            regular_events = ['close']
            
            if random.random() < 0.6:  # 60% chance of email event
                event_type = random.choice(email_events)
                email_events_sent += 1
            else:
                event_type = random.choice(regular_events)
            
            weight_data = None
            if include_weight:
                # Simulate weight changes during activity
                if event_type == 'delivery':
                    weight_data = {'weight_value': self.current_weight + random.uniform(30, 150), 'weight_threshold': 50}
                elif event_type == 'removal':
                    weight_data = {'weight_value': max(0, self.current_weight - random.uniform(25, 100)), 'weight_threshold': 50}
                else:
                    weight_data = {'weight_value': self.current_weight + random.uniform(-2, 2), 'weight_threshold': 50}
            
            success, _ = self.send_event(event_type, add_image=random.random() < 0.2, weight_data=weight_data)
            
            if success:
                events_sent += 1
            
            weight_info = f", Weight: {self.current_weight:.1f}g" if include_weight else ""
            print(f"⏳ Waiting {wait_time}s for next event... (Total: {events_sent}, Email events: {email_events_sent}{weight_info})")
            time.sleep(wait_time)
        
        print(f"✅ Simulation completed. Total events: {events_sent}, Email events: {email_events_sent}")
        if include_weight:
            print(f"🏁 Final weight: {self.current_weight:.1f}g")
        return events_sent

    def explain_email_system(self):
        """Explain how the email notification system works"""
        print(f"\n📧 Email Notification System Architecture")
        print("=" * 55)
        print("🏗️  System Design:")
        print("   • Email Address: Retrieved from Clerk user profile")
        print("   • Notification Settings: Stored in devices table")
        print("   • Email Service: MailerSend API")
        print()
        print("🔄 Email Flow:")
        print("   1. IoT device sends event → /api/iot/event")
        print("   2. Get device notification preferences from database")
        print("   3. Get user email from Clerk: clerkClient().users.getUser(clerkId)")
        print("   4. Check: email_notifications + specific event notification enabled")
        print("   5. Send email via MailerSend if all conditions met")
        print()
        print("⚙️  Required Environment Variables:")
        print("   • MAILERSEND_API_KEY")
        print("   • MAILERSEND_FROM_EMAIL") 
        print("   • MAILERSEND_FROM_NAME")
        print("   • CLERK_SECRET_KEY (for server-side API)")
        print()
        print("📋 Event Types That Trigger Emails:")
        print("   • delivery → mail_delivered_notify")
        print("   • open → mailbox_opened_notify") 
        print("   • removal → mail_removed_notify")
        print()
        
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
    """Main function for generating fake IoT data"""
    print("🎯 IoT Fake Data Generator v3.0 - Email + Weight Sensor Testing!")
    print("=" * 70)
    
    # Use a default serial that's likely to exist for testing
    generator = IoTDataGenerator("TEST_DEVICE_001")
    
    # Check device status first
    generator.check_device_status()
    
    # Generate a day's worth of activity including email events
    events, images = generator.generate_daily_activity(15)
    
    print(f"\n🎉 Fake data generation completed!")
    print(f"📍 Check the dashboard at: http://localhost:3000/dashboard")
    print(f"🔗 Device connect page: http://localhost:3000/connect-device")
    print(f"📧 Email notifications: Check your Clerk profile email and server logs!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--email-test":
            # Email notification testing mode
            serial = sys.argv[2] if len(sys.argv) > 2 else "TEST_DEVICE_001"
            generator = IoTDataGenerator(serial)
            generator.check_device_status()
            generator.test_email_notifications()
        elif sys.argv[1] == "--weight-test":
            # Weight sensor testing mode
            serial = sys.argv[2] if len(sys.argv) > 2 else "ESP32_WEIGHT_001"
            generator = IoTDataGenerator(serial)
            generator.check_device_status()
            generator.test_weight_sensor_full_suite()
        elif sys.argv[1] == "--weight-delivery":
            # Weight sensor delivery scenario
            serial = sys.argv[2] if len(sys.argv) > 2 else "ESP32_WEIGHT_001"
            generator = IoTDataGenerator(serial)
            generator.simulate_mail_delivery_scenario()
        elif sys.argv[1] == "--weight-threshold":
            # Weight sensor threshold testing
            serial = sys.argv[2] if len(sys.argv) > 2 else "ESP32_WEIGHT_001"
            generator = IoTDataGenerator(serial)
            generator.test_custom_thresholds()
        elif sys.argv[1] == "--simulate":
            # Continuous simulation mode
            duration = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            serial = sys.argv[3] if len(sys.argv) > 3 else "TEST_DEVICE_001"
            include_weight = "--weight" in sys.argv
            generator = IoTDataGenerator(serial)
            generator.simulate_device_activity(duration, include_weight)
        elif sys.argv[1] == "--quick":
            # Quick test mode
            serial = sys.argv[2] if len(sys.argv) > 2 else "TEST_DEVICE_001"
            include_weight = "--weight" in sys.argv
            generator = IoTDataGenerator(serial)
            generator.generate_daily_activity(5, include_weight)
        elif sys.argv[1] == "--check":
            # Check device status
            serial = sys.argv[2] if len(sys.argv) > 2 else "TEST_DEVICE_001"
            generator = IoTDataGenerator(serial)
            generator.check_device_status()
        elif sys.argv[1] == "--explain-email":
            # Explain email system
            generator = IoTDataGenerator()
            generator.explain_email_system()
        else:
            print("Usage:")
            print("  python3 test_iot_data.py                        # Generate 15 events")
            print("  python3 test_iot_data.py --email-test [SN]      # Test email notifications")
            print("  python3 test_iot_data.py --weight-test [SN]     # Test weight sensor (full suite)")
            print("  python3 test_iot_data.py --weight-delivery [SN] # Test weight delivery scenario")
            print("  python3 test_iot_data.py --weight-threshold [SN]# Test weight thresholds")
            print("  python3 test_iot_data.py --quick [SN] [--weight]# Generate 5 events")
            print("  python3 test_iot_data.py --simulate 10 [SN] [--weight] # Simulate for 10 minutes")
            print("  python3 test_iot_data.py --check [SN]           # Check device status")
            print("  python3 test_iot_data.py --explain-email        # Explain email system architecture")
            print("  [SN] = Serial Number (optional, defaults vary)")
            print("  --weight = Include weight sensor data in events")
    else:
        main() 