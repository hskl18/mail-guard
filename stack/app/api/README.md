# Mail Guard API

This directory contains the Next.js API routes for the Mail Guard application.

## API Endpoints

### Devices

- `GET /api/devices?name={name}` - List devices by name
- `POST /api/devices` - Create a new device
- `GET /api/devices/{id}?clerk_id={clerk_id}` - Get a specific device
- `PUT /api/devices/{id}` - Update a device
- `DELETE /api/devices/{id}?clerk_id={clerk_id}` - Delete a device
- `GET /api/devices/{id}/settings?clerk_id={clerk_id}` - Get device settings
- `PUT /api/devices/{id}/settings?clerk_id={clerk_id}` - Update device settings
- `PUT /api/devices/{id}/status` - Update device status
- `POST /api/devices/{id}/heartbeat` - Update device last seen
- `POST /api/devices/{id}/health` - Update device health metrics
- `GET /api/devices/{id}/summary?clerk_id={clerk_id}` - Get a summary of a device

### Events

- `GET /api/events?device_id={device_id}&clerk_id={clerk_id}` - Get events for a device
- `POST /api/events` - Create a new event

### Images

- `GET /api/images?device_id={device_id}&clerk_id={clerk_id}` - Get images for a device
- `POST /api/images` - Upload a new image

### Notifications

- `GET /api/notifications?device_id={device_id}&clerk_id={clerk_id}` - Get notifications for a device
- `POST /api/notifications` - Create a new notification

### Dashboard

- `GET /api/dashboard?clerk_id={clerk_id}` - Get dashboard data for a user

## Environment Variables

The API requires the following environment variables to be set:

```env
# Database Configuration
MYSQL_HOST=your-database-host.com
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mailguard_db

# SSL Certificate Configuration (optional)
# If not provided, the API will automatically look for public/certs/rds-ca.pem
# MYSQL_SSL_CA=path/to/your/certificate.pem

# AWS S3 Configuration for Image Storage
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET=your-bucket-name

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## SSL Certificate Configuration

The application supports SSL connections to your database. There are two ways to configure SSL:

### Option 1: Using public/certs directory (Recommended)

Place your SSL certificate file in `public/certs/rds-ca.pem`. The application will automatically detect and use it.

### Option 2: Using environment variable

Set the `MYSQL_SSL_CA` environment variable to the path of your certificate file.

### For AWS RDS

If you're using AWS RDS, download the certificate bundle from:
https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html

## Database Schema

The API assumes the following database tables exist:

- `devices` - Stores device information
- `mailbox_events` - Stores mailbox events (open, close, delivery, removal)
- `images` - Stores image metadata and URLs
- `notifications` - Stores notification records
- `device_health` - Stores device health metrics

## Troubleshooting

### SSL Connection Issues

If you encounter SSL connection errors:

1. Ensure your certificate file is placed in `public/certs/rds-ca.pem`
2. Check that your database server supports SSL connections
3. Verify the certificate is valid and not expired
4. For development, you can disable SSL by not providing any certificate

### CORS Issues

The API includes CORS headers for cross-origin requests. If you encounter CORS issues:

1. Check the middleware configuration in `middleware.ts`
2. Ensure your frontend domain is allowed
3. Verify that preflight OPTIONS requests are being handled correctly
