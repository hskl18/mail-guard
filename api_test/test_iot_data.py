#!/usr/bin/env python3
"""
IoT Fake Data Generator
Generate realistic fake data for IoT device testing and development
Now includes email notification testing!
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta

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
        
        print(f"🚀 IoT Data Generator for device: {self.serial_number}")
        print(f"🌐 Target API: {self.base_url}")
        print(f"📧 Email notifications will be tested if device is claimed and user email available in Clerk")

    def send_event(self, event_type=None, add_image=False, verbose=True):
        """Send a single IoT event"""
        if not event_type:
            event_type = random.choice(['open', 'close', 'delivery', 'removal'])
        
        # Simulate device state changes
        self.battery_level = max(10, self.battery_level - random.randint(0, 2))
        signal_strength = random.randint(-90, -30)
        
        # Create event data in the format expected by the API
        reed_sensor = event_type in ['open', 'delivery']  # True for open events
        mailbox_status = "opened" if reed_sensor else "closed"
        
        event_data = {
            'serial_number': self.serial_number,
            'event_data': {
                'reed_sensor': reed_sensor,
                'event_type': event_type,
                'mailbox_status': mailbox_status
            },
            'battery_level': self.battery_level,
            'signal_strength': signal_strength,
            'firmware_version': '1.2.3',
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
                
                if verbose:
                    # Check if this event should trigger email notifications
                    email_events = ['delivery', 'open', 'removal']
                    email_note = ""
                    if event_type in email_events and status == "claimed_device":
                        email_note = " 📧 (Email notification sent if enabled)"
                    elif event_type in email_events and status in ["unclaimed", "claimed_but_not_linked"]:
                        email_note = " ⚠️ (No email - device not fully claimed)"
                    
                    print(f"✅ {event_type.upper()} event sent (ID: {event_id}, Status: {status}){email_note}")
                
                # Upload image for certain events
                if add_image and event_type in ['open', 'delivery']:
                    time.sleep(0.5)  # Small delay
                    self.upload_image(event_type)
                
                return True, result
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                error_msg = error_data.get('error', f"HTTP {response.status_code}")
                print(f"❌ Event failed: {error_msg}")
                
                # Special handling for common errors
                if response.status_code == 404:
                    print(f"💡 Tip: Device serial '{self.serial_number}' not found. Create device first or use existing serial.")
                    
                return False, None
                
        except Exception as e:
            print(f"❌ Event error: {e}")
            return False, None

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

    def generate_daily_activity(self, num_events=10):
        """Generate a realistic day of mailbox activity"""
        print(f"\n📬 Generating {num_events} events for daily activity...")
        
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
            success, result = self.send_event(event_type, add_image=True)
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
            
            success, result = self.send_event(event_type, add_image)
            if success:
                events_created += 1
                if add_image:
                    images_uploaded += 1
            time.sleep(0.5)
        
        print(f"\n📊 Generation Summary:")
        print(f"   Events Created: {events_created}")
        print(f"   Images Uploaded: {images_uploaded}")
        print(f"   Battery Level: {self.battery_level}%")
        print(f"   📧 Email notifications sent for delivery/open/removal events (if enabled)")
        
        return events_created, images_uploaded

    def simulate_device_activity(self, duration_minutes=5):
        """Simulate continuous device activity for testing"""
        print(f"\n⏱️  Simulating device activity for {duration_minutes} minutes...")
        print("This includes email notification events mixed with regular activity.")
        
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
            
            success, _ = self.send_event(event_type, add_image=random.random() < 0.2)
            
            if success:
                events_sent += 1
            
            print(f"⏳ Waiting {wait_time}s for next event... (Total: {events_sent}, Email events: {email_events_sent})")
            time.sleep(wait_time)
        
        print(f"✅ Simulation completed. Total events: {events_sent}, Email events: {email_events_sent}")
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
            # Try to get device events to see status
            response = requests.get(
                f"{self.base_url}/api/iot/event",
                params={'serial_number': self.serial_number, 'limit': 1},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Device found: {self.serial_number}")
                print(f"   Claimed: {data.get('is_claimed', 'Unknown')}")
                print(f"   Model: {data.get('device_model', 'Unknown')}")
                return True
            elif response.status_code == 404:
                print(f"❌ Device not found: {self.serial_number}")
                print("💡 You may need to create this device first or use an existing serial number")
                return False
            else:
                print(f"⚠️ Unable to check device status: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error checking device: {e}")
            return None

def main():
    """Main function for generating fake IoT data"""
    print("🎯 IoT Fake Data Generator v2.0 - Now with Email Testing!")
    print("=" * 60)
    
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
        elif sys.argv[1] == "--simulate":
            # Continuous simulation mode
            duration = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            serial = sys.argv[3] if len(sys.argv) > 3 else "TEST_DEVICE_001"
            generator = IoTDataGenerator(serial)
            generator.simulate_device_activity(duration)
        elif sys.argv[1] == "--quick":
            # Quick test mode
            serial = sys.argv[2] if len(sys.argv) > 2 else "TEST_DEVICE_001"
            generator = IoTDataGenerator(serial)
            generator.generate_daily_activity(5)
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
            print("  python3 test_iot_data.py                    # Generate 15 events")
            print("  python3 test_iot_data.py --email-test [SN]  # Test email notifications")
            print("  python3 test_iot_data.py --quick [SN]       # Generate 5 events")
            print("  python3 test_iot_data.py --simulate 10 [SN] # Simulate for 10 minutes")
            print("  python3 test_iot_data.py --check [SN]       # Check device status")
            print("  python3 test_iot_data.py --explain-email    # Explain email system architecture")
            print("  [SN] = Serial Number (optional, defaults to TEST_DEVICE_001)")
    else:
        main() 