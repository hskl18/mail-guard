# Smart Mailbox Monitor

A comprehensive smart mailbox monitoring system that helps users track their mailbox activity, receive notifications, and view mailbox images.

## Project Structure

```
.
├── backend/           # FastAPI backend service
├── frontend/         # Frontend application
├── IOT/              # IoT device code
└── Server/           # Additional server components
```

## Backend Service

The backend is built with FastAPI and provides a robust API for managing smart mailbox devices, events, and notifications.

### Features

- Device Management

  - Register and manage smart mailbox devices
  - Track device status and firmware versions
  - Monitor device locations

- Mailbox Events

  - Track mailbox open/close events
  - Historical event logging
  - Real-time event processing

- Image Management

  - Store and retrieve mailbox images
  - Image URL management
  - Timestamp tracking

- Notification System
  - Real-time notifications
  - Multiple notification types
  - User-specific notification routing

### API Endpoints

- `POST /devices` - Register a new device
- `GET /devices` - List user's devices
- `PUT /devices/{device_id}` - Update device info
- `POST /mailbox/events` - Record an open/close event
- `GET /mailbox/events` - List events for a device
- `POST /mailbox/images` - Save an image URL
- `GET /mailbox/images` - List images for a device
- `POST /mailbox/notifications` - Record a notification
- `GET /mailbox/notifications` - List notifications for a user

### Database Schema

The system uses MySQL with the following tables:

- `users` - User account information
- `devices` - Smart mailbox device details
- `mailbox_events` - Mailbox open/close events
- `images` - Mailbox image records
- `notifications` - System notifications

## Setup and Installation

### Prerequisites

- Docker and Docker Compose
- MySQL server
- Python 3.8+

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
MYSQL_HOST=your_mysql_host
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=mailbox_monitor
MYSQL_SSL_CA=path_to_ssl_ca
```

### Running the Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Start the services using Docker Compose:

   ```bash
   docker-compose up -d
   ```

3. The API will be available at `http://localhost:8000`

### API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Running Tests

```bash
docker-compose run test
```

### Code Structure

- `main.py` - Core API implementation
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Service orchestration
- `certs/` - SSL certificates
- `tests/` - Test suite

## Security

- SSL/TLS encryption for database connections
- Secure password storage
- API authentication
- Input validation using Pydantic models

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
