## Mail Guard

Smart Mailbox is an end-to-end IoT solution that transforms any standard mailbox into a secure, connected device. Featuring an ESP32 microcontroller, magnetic reed switch, weight sensor, and onboard camera, it detects mail insertion/removal and door openings, then pushes real-time notifications and delivery images to a Next.js web dashboard backed by a lightweight MQTT/API server.

Key features:

Hardware: ESP32 + reed switch + load cell + camera + battery pack

Firmware: Arduino/PlatformIO code for sensor reading, image capture, and HTTP communication

Backend: Python + REST API for data ingestion & processing

Frontend: Next.js app with real-time alerts, mailbox status overview, and delivery history

Battery Optimizations: Deep-sleep scheduling, error handling, and low-power design

Database: MySQL of Aiven.io for data storage

Use this repo to build, test, and deploy your own smart mailbox prototype in under a quarter!
