# Mail Guard - Smart Mailbox Monitor

A comprehensive IoT solution for monitoring mailboxes and shared delivery hubs. Mail Guard provides real-time notifications, image capture, and secure access tracking for your packages and mail.

## 🌐 Online Demo

- Frontend: [https://mail-guard-ten.vercel.app/](https://mail-guard-ten.vercel.app/)
- API: [https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws/](https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws/)

## 📋 Overview

Mail Guard is designed to add security to your mailbox and prevent mail theft. The system consists of:

1. Hardware device (ESP32-based) that attaches inside a standard mailbox or delivery locker
2. Cloud backend API (FastAPI on AWS Lambda)
3. User-friendly web dashboard (Next.js)

### Features:

- **Real-time monitoring** of mailbox/locker door access
- **Photo evidence** with a camera that captures images on access events
- **Instant notifications** via email/SMS for deliveries and pickups
- **Battery status monitoring** with low-battery alerts
- **User-friendly dashboard** for viewing events, images, and managing settings

## 🚀 Quick Start

### Prerequisites

- Python 3.11+ for backend
- Node.js 18+ for frontend
- MySQL database
- AWS account (for production deployment)
- Clerk account (for authentication)

### Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/mail-guard.git
   cd mail-guard
   ```

2. Set up backend:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt

   # Configure environment variables - create .env file in backend/
   # See backend/README.md for required variables

   # Start the backend
   cd backend
   uvicorn main:app --reload --port 8000
   ```

3. Set up frontend:

   ```bash
   cd frontend
   npm install
   # or
   pnpm install

   # Configure environment variables - create .env.local
   # See frontend/README.md for required variables

   # Start the frontend
   npm run dev
   # or
   pnpm dev
   ```

4. Open in browser:
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

## 🛠️ Technology Stack

### Backend

- **Python 3.11** with FastAPI & Pydantic
- **MySQL** database with SSL support
- **AWS Lambda** & API Gateway for serverless deployment
- **AWS CDK** for infrastructure as code
- **S3** for image storage
- **MailerSend** for email notifications

### Frontend

- **Next.js 15** (App Router) with React 19
- **TypeScript** for type safety
- **Tailwind CSS** & shadcn/ui for styling
- **Clerk** for authentication
- **Recharts** for data visualization

### Hardware

- **ESP32** microcontroller
- **OV2640** camera module
- **Reed switch** for door sensing
- **Battery-powered** for easy installation

## 📁 Repository Structure

```
.
├── backend/            # FastAPI backend service
│   ├── main.py         # API implementation
│   ├── requirements.txt# Python dependencies
│   ├── Dockerfile.*    # Docker images for local and Lambda
│   ├── docker-compose.yml
│   └── cdk/            # AWS CDK deployment
├── frontend/           # Next.js frontend application
│   ├── app/            # Next.js App Router pages
│   ├── components/     # UI components
│   └── package.json    # Node dependencies
├── assets/             # Static assets (images, icons)
└── README.md           # This file
```

## 📋 Project Documentation

- Backend API: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)
- AWS Deployment: [backend/cdk/README.md](backend/cdk/README.md)

## 🔄 Project Pivot - Delivery Hub

### Pivot Overview

We're expanding Mail Guard beyond individual mailboxes into a **shared, secure delivery hub** for:

- College campuses
- HOAs and apartment complexes
- Office buildings
- Any shared mail/package area

### Key Features of Delivery Hub

- **Secure package drop** with access tracking
- **Photo evidence** of every access event
- **Real-time notifications** for residents and building staff
- **Retrofit compatibility** with existing lockers and mailboxes

### Target Environments

- **College dorms & university campuses**
- **HOA & gated-community mail kiosks**
- **Multi-tenant apartment buildings**
- **Office mailrooms**

## 📊 System Architecture

```
[ESP32 Module]
├─ Reed switch (door)
├─ Camera (OV2640)
│
↓ HTTPS
│
[API Gateway] → [Lambda (FastAPI)]
               ├─ MySQL (events & devices)
               ├─ S3 (images)
               └─ MailerSend (notifications)
               │
               ↓
[Next.js Web Dashboard] ← Clerk Auth
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
