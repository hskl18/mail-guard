# Mail Guard (Smart Mailbox Monitor) IOT MVP

A comprehensive smart mailbox monitoring system.

## Online Demo

[https://mail-guard-ten.vercel.app/](https://mail-guard-ten.vercel.app/)
[https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws/](https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws/)

## Repository Structure

```
.
├── backend/            # FastAPI backend service
│   ├── main.py         # API implementation
│   ├── requirements.txt# Python dependencies
│   ├── Dockerfile.*    # Docker images for local and Lambda
│   ├── docker-compose.yml
│   └── cdk/            # AWS CDK deployment for AWS
├── frontend/           # Next.js frontend application
│   ├── app/            # Next.js App Router pages
│   ├── components/     # UI components & hooks
│   └── package.json    # Node dependencies
├── assets/             # Static assets (images, icons)
└── README.md           # This file
```

## Technology Stack

- Backend:
  - Python 3.11, FastAPI, Pydantic
  - MySQL with SSL via `mysql.connector`
  - AWS Lambda (Mangum adapter) & API Gateway
  - AWS CDK (Python) for infrastructure
  - S3 for image storage; SNS & MailerSend for notifications
- Frontend:
  - Next.js 15 (App Router), React 19, TypeScript
  - Tailwind CSS & shadcn/ui components
  - Clerk for authentication & session management
- Infrastructure:
  - AWS CDK & CloudFormation
- Sensor:
  - ESP32
  - OV2640 camera module
  - Reed switch sensor

## Quick Start

Refer to each service directory for detailed instructions:

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- CDK Deployment: `backend/cdk/README.md`

First, create a virtual environment and install dependencies:

```
python3 -m venv .venv
source .venv/bin/activate

pip install -r backend/requirements.txt -r backend/cdk/requirements.txt
```

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/xyz`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.
