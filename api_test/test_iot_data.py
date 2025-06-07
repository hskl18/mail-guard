#!/usr/bin/env python3
"""
IoT Fake Data Generator
Generate realistic fake data for IoT device testing and development
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta

class IoTDataGenerator:
    def __init__(self, serial_number="name", base_url="http://localhost:3000"):
        self.serial_number = serial_number
        self.base_url = base_url
        self.demo_image_path = "demo.jpg"
        
        # Device simulation state
        self.battery_level = random.randint(80, 100)
        self.is_online = True
        self.last_event_time = datetime.now()
        
        print(f"🚀 IoT Data Generator for device: {self.serial_number}")
        print(f"🌐 Target API: {self.base_url}")

    def send_event(self, event_type=None, add_image=False):
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
                event_id = result.get('event_id', 'unknown')
                print(f"✅ {event_type.upper()} event sent (ID: {event_id})")
                
                # Upload image for certain events
                if add_image and event_type in ['open', 'delivery']:
                    time.sleep(0.5)  # Small delay
                    self.upload_image(event_type)
                
                return True, result
            else:
                print(f"❌ Event failed: {response.status_code}")
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

    def generate_daily_activity(self, num_events=10):
        """Generate a realistic day of mailbox activity"""
        print(f"\n📬 Generating {num_events} events for daily activity...")
        
        events_created = 0
        images_uploaded = 0
        
        # Typical daily sequence
        daily_events = [
            ('delivery', 'Morning mail delivery'),
            ('open', 'Check mail after work'),
            ('removal', 'Take mail out'),
            ('close', 'Close mailbox'),
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
        
        return events_created, images_uploaded

    def simulate_device_activity(self, duration_minutes=5):
        """Simulate continuous device activity for testing"""
        print(f"\n⏱️  Simulating device activity for {duration_minutes} minutes...")
        
        end_time = datetime.now() + timedelta(minutes=duration_minutes)
        events_sent = 0
        
        while datetime.now() < end_time:
            # Random event every 30-120 seconds
            wait_time = random.randint(30, 120)
            
            event_type = random.choice(['open', 'close', 'delivery', 'removal'])
            success, _ = self.send_event(event_type, add_image=random.random() < 0.2)
            
            if success:
                events_sent += 1
            
            print(f"⏳ Waiting {wait_time}s for next event... (Total sent: {events_sent})")
            time.sleep(wait_time)
        
        print(f"✅ Simulation completed. Total events: {events_sent}")
        return events_sent

def main():
    """Main function for generating fake IoT data"""
    print("🎯 IoT Fake Data Generator")
    print("=" * 50)
    
    generator = IoTDataGenerator()
    
    # Generate a day's worth of activity
    events, images = generator.generate_daily_activity(15)
    
    print(f"\n🎉 Fake data generation completed!")
    print(f"📍 Check the dashboard at: http://localhost:3000/dashboard")
    print(f"🔗 Device connect page: http://localhost:3000/connect-device")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--simulate":
            # Continuous simulation mode
            duration = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            generator = IoTDataGenerator()
            generator.simulate_device_activity(duration)
        elif sys.argv[1] == "--quick":
            # Quick test mode
            generator = IoTDataGenerator()
            generator.generate_daily_activity(5)
        else:
            print("Usage:")
            print("  python3 test_iot_data.py              # Generate 15 events")
            print("  python3 test_iot_data.py --quick      # Generate 5 events")
            print("  python3 test_iot_data.py --simulate 10 # Simulate for 10 minutes")
    else:
        main() 