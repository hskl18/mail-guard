# Smart Mailbox Backend API

This is the backend service for the Smart Mailbox Monitor system, built with FastAPI and deployed as either a local service or AWS Lambda function.

https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws/docs#/default/create_device_devices_post

## Overview

The backend provides a REST API for:

- Device management with Clerk authentication integration
- Mailbox open/close event tracking
- Image storage (with S3 integration)
- Notification delivery (with SES integration)

## Database Schema

The MySQL database consists of the following tables:

- **devices** - Connected mailbox devices with clerk_id and email

  - id, clerk_id, email, name, location, is_active, last_seen, created_at, updated_at

- **mailbox_events** - Records of mailbox open/close activity

  - id, device_id, event_type (open/close), occurred_at

- **images** - Photos taken by mailbox devices

  - id, device_id, image_url, captured_at

- **notifications** - Messages sent to users about mailbox activity
  - id, device_id, notification_type, sent_at

## Environment Setup

Create a `.env` file with the following variables:

```
# Database Configuration
MYSQL_HOST=your_database_host
MYSQL_PORT=your_database_port
MYSQL_USER=your_database_user
MYSQL_PASSWORD=your_database_password
MYSQL_DATABASE=your_database_name
MYSQL_SSL_CA=certs/rds-ca.pem

# AWS Services
S3_BUCKET=your_s3_bucket_name
SES_SOURCE_EMAIL=your_verified_email@example.com
AWS_REGION=us-west-2
```

## API Endpoints

### Device Management

- `POST /devices` - Register a new device
- `GET /devices` - List devices for a clerk_id
- `GET /devices/{device_id}` - Get a specific device
- `PUT /devices/{device_id}` - Update device details
- `DELETE /devices/{device_id}` - Remove a device
- `PATCH /devices/{device_id}/status` - Update device active status
- `POST /devices/{device_id}/heartbeat` - Update last_seen timestamp

### Mailbox Events

- `POST /mailbox/events` - Create a mailbox open/close event
- `GET /mailbox/events` - List events for a device
- `DELETE /mailbox/events/{event_id}` - Remove an event

### Images

- `POST /mailbox/images` - Upload an image to S3
- `GET /mailbox/images` - List images for a device
- `DELETE /mailbox/images/{image_id}` - Remove an image (deletes from S3 also)

### Notifications

- `POST /mailbox/notifications` - Send a notification
- `GET /mailbox/notifications` - List notifications for a device
- `DELETE /mailbox/notifications/{notification_id}` - Remove a notification

## Running Locally

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Make sure your `.env` file is set up.

3. Run the development server:

   ```bash
   uvicorn main:app --reload
   ```

4. Access the API documentation at http://localhost:8000/docs

## Docker Deployment

Run the service using Docker Compose:

```bash
docker-compose up -d
```

This will start the service on port 9000.

## AWS Lambda Deployment

The backend is configured to run as an AWS Lambda function using Mangum adapter.

1. Build the Docker image:

   ```bash
   docker build -t mailbox-api -f Dockerfile.lambda .
   ```

2. Deploy using CDK from the cdk/ directory.

## Testing

To test the database connection:

```bash
python test_db_connection.py
```

## API Documentation

- Swagger UI: `/docs`
- ReDoc: `/redoc`
