# MailGuard – Smart Cluster Mailbox Monitor

Welcome to **MailGuard**, a smart, IoT-integrated cluster mailbox monitoring system designed to secure and streamline package deliveries in residential communities! This project provides real-time security monitoring, theft prevention, and delivery tracking for cluster mailbox installations. 🚀

---

## 🌟 Ideal Product Vision

Imagine a cluster mailbox system that doubles as a comprehensive security and delivery management platform. The **ideal MailGuard system** integrates:

📦 **Real-Time Access Monitoring**  
📸 **Photo Evidence Capture**  
🔔 **Instant Delivery Notifications**  
🌐 **Cloud-Based Management Dashboard**

All collected data is:

- 📡 Transmitted via WiFi to cloud backend
- 💽 Stored in secure MySQL database
- 📊 Visualized on a modern web dashboard
- 📱 Delivered through instant email notifications
- 🛡️ Protected with enterprise-grade authentication

---

## 🔨 MVP (Minimum Viable Product)

For this project, our MVP includes:

### ✅ Hardware

- ESP32-CAM microcontroller with integrated camera
- Magnetic reed switch for door access detection

### ✅ Software

- ESP32 sends event data via HTTPS over WiFi
- Next.js fullstack for frontend and backend
- Clerk authentication for secure user access
- Email notifications via MailerSend integration

---

## 🧰 Required Technologies

### 📟 Electronics

- ESP32-CAM (OV2640 camera module)
- Magnetic reed switch + magnet

### 🌐 Software

- **Backend & Frontend**: Next.js
- **Database**: MySQL on Aiven RDS
- **Storage**: AWS S3 for image storage
- **Authentication**: Clerk for secure user management
- **Notifications**: MailerSend for email alerts
- **Deployment**: AWS CDK for infrastructure as code

### 🖧 System Architecture

```
[Cluster Mailbox]
    ↓
[ESP32-CAM Module]
├─ Reed Switch (door sensor)
├─ OV2640 Camera
├─ Battery System
    ↓ HTTPS/WiFi
[Next.js (Fullstack)]
    ↓
[Aiven (MySQL)]
├─ MySQL (events & devices)
├─ S3 (photo storage)
└─ MailerSend (notifications)
    ↓
[Next.js Dashboard] ← Clerk Auth
```

---

## 🎯 Target Market

We aim to help two key groups:

1. 🏘️ **Residential Communities & HOAs**  
   For cluster mailbox security and package theft prevention in neighborhoods and apartment complexes.

2. 🏢 **Property Management Companies**  
   To reduce liability, improve resident satisfaction, and streamline mail/package management across multiple properties.

---

## 📆 Development Timeline

### 🗓️ Phase 1: Prototype Planning & Setup (Weeks 1-4)

- **Project Foundation**:
  - Brainstorm and design the prototype concept
  - Set up Next.js fullstack application structure
  - Configure Aiven MySQL database connection
  - Design basic database schemas for devices and events

---

### 🗓️ Phase 2: Core Prototype Development (Weeks 5-7)

- **Frontend Prototype**:
  - Build Next.js frontend with Tailwind CSS and shadcn/ui
  - Implement Clerk authentication system
  - Create basic event monitoring interface
- **Backend API**:
  - Develop Next.js API routes for device events
  - Implement image upload functionality to S3
  - Set up MailerSend email notification system

---

### 🗓️ Phase 3: Hardware Prototype Integration (Weeks 8-10)

- **ESP32 Prototype Development**:
  - Develop ESP32-CAM firmware for basic photo capture
  - Implement reed switch door detection logic
  - Test battery life and power management
- **System Integration**:
  - Connect ESP32 prototype to Next.js backend
  - Test end-to-end photo capture and notification flow
  - Validate prototype functionality in controlled environment

---

## 🌐 Live Demo

- **Frontend Dashboard**: [https://mail-guard-ten.vercel.app/](https://mail-guard-ten.vercel.app/)
- **API Documentation**: [https://mail-guard-ten.vercel.app/api](https://mail-guard-ten.vercel.app/api)

---

## 📌 Project Status

> 🔬 Currently in **Prototype Phase** - Building MVP for cluster mailbox security

**What's Working:**

- ✅ Next.js fullstack application with Clerk authentication
- ✅ MySQL database integration via Aiven
- ✅ Basic frontend dashboard for monitoring
- ✅ Email notification system via MailerSend

**Currently Developing:**

- 🔧 ESP32-CAM hardware prototype
- 🔧 Photo capture and upload functionality
- 🔧 Real-time event monitoring

Want to follow the prototype development? Star this repo and check back for updates!

---

## 🔧 Prototype Setup

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/mail-guard.git
cd mail-guard

# Frontend setup
cd frontend
pnpm install
pnpm dev
```

### Environment Variables

**Frontend (.env.local)**:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
DATABASE_URL=mysql://user:pass@your-aiven-host/mailguard
AWS_ACCESS_KEY_ID=your_s3_key
AWS_SECRET_ACCESS_KEY=your_s3_secret
MAILERSEND_API_KEY=your_mailersend_key
```

---

## 📁 Repository Structure

```
mail-guard/
├── frontend/           # Next.js fullstack application
│   ├── app/            # App Router pages & API routes
│   ├── components/     # UI components
│   ├── lib/            # Database & utility functions
│   └── package.json    # Dependencies
└── assets/             # Documentation assets
```

---

## 📋 Hardware Bill of Materials

| Component   | Quantity | Est. Cost | Purpose                   |
| ----------- | -------- | --------- | ------------------------- |
| ESP32-CAM   | 1        | $12       | Main controller + camera  |
| Reed Switch | 1        | $2        | Door open/close detection |

---

## 🚀 Future Enhancements

- **Multi-Unit Management**: Support for multiple cluster mailbox locations
- **Mobile App**: Native iOS/Android apps for on-the-go monitoring
- **AI Analytics**: Machine learning for delivery pattern analysis
- **Integration APIs**: Connect with popular delivery services
- **Solar Charging**: Extended battery life with solar panel option

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## About

**MailGuard** is a comprehensive IoT solution designed to secure cluster mailboxes and prevent package theft in residential communities. Our smart monitoring system combines hardware sensors, cloud infrastructure, and user-friendly interfaces to provide real-time security and delivery management.

### Topics

🏷️ iot • hardware • security • mailbox • delivery • fullstack • aws • nextjs • fastapi
