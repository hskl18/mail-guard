# Smart Mailbox Monitor Backend

This is the backend service for the Smart Mailbox Monitor project, built with FastAPI and MySQL.

## Features

- RESTful API for smart mailbox monitoring
- MySQL database with connection pooling
- Secure SSL database connection
- Docker support for easy deployment
- Comprehensive API endpoints for:
  - Device management
  - Mailbox events tracking
  - Image storage
  - Notification handling

## Prerequisites

- Python 3.8+
- MySQL Server
- Docker and Docker Compose (for containerized deployment)

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables:

```bash
MYSQL_HOST=your_host
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mailbox_monitor
MYSQL_SSL_CA=/etc/secrets/ca.pem # (depend how you keep the secret)
```

## Running Locally

Start the development server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Main Endpoints

- `/devices` - Device management (POST, GET)
- `/mailbox/events` - Mailbox event tracking (POST, GET)
- `/mailbox/images` - Image storage (POST, GET)
- `/mailbox/notifications` - Notification handling (POST, GET)

## Docker Deployment

1. Build and run using Docker Compose:

```bash
docker-compose up --build
```

2. For production deployment, ensure to:
   - Set up proper environment variables
   - Configure SSL certificates
   - Use secure database credentials

## Testing

Run the test suite:

```bash
pytest
```

## Security Notes

- Always use SSL for database connections
- Keep your SSL certificates secure
- Use strong passwords for database access
- Regularly update dependencies

## Database Schema

The backend automatically creates the following tables:

- users
- devices
- mailbox_events
- images
- notifications

Each table is properly indexed and includes foreign key constraints for data integrity.
