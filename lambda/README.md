# Since Lambda response is not fast enough, we need to use a nextjs api route to handle the requests.

# Smart Mailbox Backend API

This backend service exposes RESTful endpoints for managing devices, mailbox events, image uploads, and notifications for the Smart Mailbox Monitor system.

## Technology Stack

- Python 3.11
- FastAPI & Pydantic
- MySQL (with optional SSL via `SSL_CA`)
- AWS Lambda with Mangum adapter
- AWS CDK for deployment
- Docker & Docker Compose
- S3 for image storage
- MailerSend for email notifications

## Prerequisites

- Python 3.11
- pip
- Docker (for containerized local or Lambda builds)
- AWS CLI & AWS CDK (for AWS deployment)

## Environment Configuration

Create a `.env` file in `backend/`:

```env
# MySQL Configuration
MYSQL_HOST=your_db_host
MYSQL_PORT=3306
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DATABASE=mailbox_db
MYSQL_SSL_CA=certs/rds-ca.pem

# AWS & Storage
S3_BUCKET=your_s3_bucket_name

# MailerSend
MAIL_API=your_mailersend_api_key
MAIL_USERNAME=your@domain.com
MAIL_FROM_NAME="Your Name"

# Schema Initialization (true/false)
INIT_SCHEMA=true
```

## Running Locally

1. Install dependencies:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Ensure `.env` is configured.

3. Start the FastAPI server:

   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. Swagger UI available at `http://localhost:8000/docs`

## Docker Compose

Start services locally using Docker:

```bash
cd backend
docker-compose up --build -d
```

- API at `http://localhost:9000`

## AWS Lambda Deployment

1. Build Docker image for Lambda:

   ```bash
   cd backend
   docker build -t mailbox-api -f Dockerfile.lambda .
   ```

2. Deploy with CDK:

   ```bash
   cd cdk
   source .venv/bin/activate  # create venv if needed
   pip install -r requirements.txt
   cdk bootstrap
   cdk deploy
   ```

## Further Documentation

- CDK Infrastructure: `backend/cdk/README.md`

## License

MIT License
