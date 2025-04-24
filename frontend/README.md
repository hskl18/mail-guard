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
