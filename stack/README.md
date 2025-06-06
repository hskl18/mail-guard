# Smart Mailbox Frontend

A web application for monitoring smart mailbox devices in real-time.

## Technology Stack

- Next.js 15 (App Router)
- React 19 & TypeScript
- Tailwind CSS & shadcn/ui
- Clerk for authentication
- Recharts, Lucide icons, React Hook Form, etc.

## Prerequisites

- Node.js 18.x or higher
- pnpm or npm
- Clerk account (obtain API keys)

## Getting Started

1. Install dependencies:

   ```bash
   cd frontend
   pnpm install
   # or npm install
   ```

2. Configure environment variables:

   Create `.env.local` in `frontend/`:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   NEXT_PUBLIC_CLERK_SECRET_KEY=your_clerk_secret_key
   ```

3. Run development server:

   ```bash
   pnpm dev
   # or npm run dev
   ```

4. Open in browser: `http://localhost:3000`

## Build for Production

```bash
pnpm build
pnpm start
```

Deploy with Vercel, Netlify, or any Node.js hosting.

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Base URL for backend API
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `NEXT_PUBLIC_CLERK_SECRET_KEY`: Clerk secret key

## License

MIT License

# Smart Mailbox Monitor

A modern web application for monitoring your mailbox in real-time. This project provides a user interface for a smart device that detects mail delivery, mailbox access, and captures images for security.

<!-- ![Smart Mailbox Monitor Dashboard](/placeholder.svg?height=400&width=800) -->

## 📋 Overview

The Smart Mailbox Monitor is designed to add security to your mailbox and prevent mail theft. The system consists of a hardware device that attaches inside a standard mailbox and a web application for monitoring and configuration.

The hardware device uses sensors to detect:

- When mail is delivered
- When the mailbox is opened/closed
- When mail is removed
- It also captures images when these events occur

This repository contains the frontend web application that communicates with the hardware device through a cloud backend.

## ✨ Features

### Authentication

- Secure user authentication with Clerk
- User profile management
- Protected routes for authenticated users only

### Dashboard

- Real-time mailbox status monitoring (open/closed)
- Mail presence indicator
- Battery level monitoring with low battery alerts
- Recent activity timeline
- Quick actions for common tasks

### Notifications

- Comprehensive notification system for all mailbox events
- Filtering options by notification type
- Image viewing for mail delivery and mailbox access events
- Visual indicators for different notification types

### Settings

- Customizable notification preferences
- Device configuration (check intervals, battery thresholds)
- Camera settings for image capture
- Account management and security settings
- WiFi connectivity management

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Clerk
- **State Management**: React Hooks

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Clerk account (for authentication)
