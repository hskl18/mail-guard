# Proposal: MailGuard Smart Delivery Hub for California University Campuses

## 1. Executive Summary

MailGuard is launching a Smart Delivery Hub tailored for university environments in California. Our goal is to secure and streamline package and meal deliveries on campus, solving widespread issues of theft and inefficient pickup. The initial prototype is a compact module—a small, battery‑powered box equipped with a magnetic reed switch (door sensor) and an OV2640 camera. When mounted inside a locker or mailbox compartment, it instantly detects access events, captures a photo, and sends data over HTTPS to our cloud backend. This proposal outlines the problem, our solution, prototype details, technical architecture, and a phased implementation plan.

## 2. Problem Statement

### 2.1 Rising Theft and Lost Deliveries

- Students living on campus face frequent package and food theft. Dorm hallways and mailrooms often see unattended parcels stolen or misplaced.
- Food deliveries (Uber Eats, DoorDash) are dropped at common areas, leaving meals vulnerable to theft or spoilage.

### 2.2 Inefficient Pickup Process

- Traditional mailrooms require staff intervention and have limited hours. Students queue in long lines to retrieve parcels, causing delays and frustration.
- Lack of real‑time visibility: students don't know when their package arrives or if it was stolen, leading to repeated inquiries with mail staff.

### 2.3 Limited Existing Solutions

- Large locker systems (Amazon Hub, Luxer One, Parcel Pending) are expensive ($10k–$20k per locker bank), require significant installation, and often cater only to packages, not food.
- Smaller or modular solutions for individual lockers do not exist at an affordable price point, leaving many smaller colleges or dorms unprotected.

## 3. Proposed Solution

MailGuard will deliver a scalable, affordable Smart Delivery Hub that:

- Secures packages and meals in private compartments (lockers or standard mailboxes).
- Provides real‑time alerts when a compartment is accessed, with an image log.
- Integrates seamlessly with campus apps for notifications and user management.
- Offers a low‑cost, modular design so facilities can deploy one small unit per locker or mailbox, rather than purchasing large locker banks.

### 3.1 Key Features

- **Door Open/Close Detection**: Magnetic reed switch detects when a locker door is opened or closed.
- **Photo Capture**: OV2640 camera snaps an image at each access event, creating a visual log.
- **Real‑Time Notifications**: Via email and SMS (through AWS SES/SNS), notifying the student or dorm staff immediately upon delivery or retrieval.
- **Minimal Installation**: Battery‑powered prototype mounts inside any locker or mailbox compartment with double‑sided tape—no wiring required.
- **Cloud Backend**: FastAPI running on AWS Lambda, MySQL on RDS storing events, and S3 for images.
- **User Dashboard**: Next.js frontend (hosted on Vercel) displays event history, snapshots, and device status (including battery level in future iterations).

## 4. Prototype Description

Our v1 prototype is a compact, self‑contained module that fits within a single locker or mailbox compartment:

- **Enclosure**: 3D‑printed ABS/PLA plastic box (~3×3×2 inches)
- **Sensors & Electronics**:
  - ESP32‑CAM board as the microcontroller and camera.
  - Magnetic reed switch mounted on the door frame; corresponding magnet on the latch.
  - Lithium‑ion battery with onboard charger (TP4056), providing several weeks of standby between charges.
- **Firmware Logic**:
  1. Boot into deep‑sleep mode.
  2. On reed switch state change (door open), wake up.
  3. Capture photo via OV2640, store temporarily in SRAM/flash.
  4. Connect to campus Wi‑Fi (or a dedicated access point).
  5. Upload image to S3 via HTTPS POST and send event metadata (device ID, timestamp, event_type) to FastAPI Lambda.
  6. Return to deep sleep to save power.
- **Physical Mounting**:
  - Magnet & Switch attach to locker door and frame.
  - Module is secured to the interior wall of the compartment with foam tape or small screws.
- **Early Test Results**:
  - Detects door open/close reliably (no false triggers).
  - Camera captures 640×480 JPEG in <300 ms.
  - Battery life: ~3 weeks with average 10 accesses per day (based on deep‑sleep current draw).

This minimal hardware demonstrates the core functionality—security and visibility—before adding secondary sensors (e.g., weight) or multi‑compartment support.

## 5. Technical Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Campus Locker/Mailbox                     │
│                                                                │
│   ┌──────────────────┐      ┌────────────────────────────────┐  │
│   │  MailGuard IoT   │      │   Cloud Backend & Services     │  │
│   │   Prototype Box  │      │                                │  │
│   │  ┌────────────┐  │      │  ┌──────────────────────────┐  │  │
│   │  │Reed Switch │  │      │  │API Gateway (HTTPS)       │  │  │
│   │  └────────────┘  │      │  └──────────────────────────┘  │  │
│   │        │         │      │          ↓                     │  │
│   │        ↓         │      │  ┌──────────────────────────┐  │  │
│   │  ┌────────────┐  │      │  │ AWS Lambda (FastAPI)     │  │  │
│   │  │ OV2640     │  │      │  │  • /mailbox/events        │  │  │
│   │  │ Camera     │  │      │  │  • /mailbox/images        │  │  │
│   │  └────────────┘  │      │  │  • /mailbox/notifications │  │  │
│   │        │         │      │  └──────────────────────────┘  │  │
│   │        ↓         │      │          ↓                     │  │
│   │  ┌────────────┐  │      │  ┌──────────────────────────┐  │  │
│   │  │   ESP32    │──┼──Wi‑Fi│  │  Amazon RDS (MySQL)       │  │  │
│   │  │ Controller │  │      │  │  • devices, events, notifs│  │  │
│   │  └────────────┘  │      │  └──────────────────────────┘  │  │
│   │      ││ Battery   │      │          ↓                     │  │
│   │      ↓│ Backup    │      │  ┌──────────────────────────┐  │  │
│   │  ┌────────────┐  │      │  │  Amazon S3 (Images)       │  │  │
│   │  │ Li‑Ion Batt │  │      │  └──────────────────────────┘  │  │
│   │  └────────────┘  │      │          ↓                     │  │
│   │                   │      │  ┌──────────────────────────┐  │  │
│   │  (Deep Sleep)     │      │  │  SES / SNS (Notifications)│  │  │
│   └──────────────────┘      │  └──────────────────────────┘  │  │
└────────────────────────────────────────────────────────────────┘

                                 ↓
                         [Next.js Web Dashboard]
                       (Vercel | Clerk Authentication)
```

### 5.1 Device Layer

- ESP32‑CAM module: reed switch + OV2640 camera + battery.
- Deep‑sleep cycles for low power.

### 5.2 Network Layer

- HTTPS calls to API Gateway (or direct Lambda Function URL) for events and image uploads.
- TLS certificate configured for secure transport.

### 5.3 Backend Layer

- **AWS Lambda (FastAPI)**:
  - /mailbox/events records "door_open" or "door_close" with timestamp.
  - /mailbox/images accepts multipart/form-data for image upload; returns S3 URL.
  - /mailbox/notifications stores a notification record and publishes an SNS message.
- **Amazon RDS (MySQL)**: stores device registrations, event logs, and notification metadata.
- **Amazon S3**: stores image files; bucket policies restrict access.
- **Amazon SES / SNS**: sends email and SMS alerts to students or dorm staff.

### 5.4 Frontend Layer

- Next.js dashboard with Clerk for authentication, displaying:
  - Real‑time event feed (open/close times).
  - Image thumbnails and full‑size snapshots.
  - Device status (battery level, last_seen).
  - Student view: see only their assigned locker/device.
  - Staff/Admin view: monitor all hub units on campus, adjust settings, and manage notifications.

## 6. Prototype Capabilities & Limitations

### 6.1 Capabilities

- **Event Detection & Logging**
  - Reed switch accurately triggers on door open/close.
  - Events timestamped and sent reliably via Wi‑Fi.
- **Photo Evidence**
  - OV2640 captures 640×480 JPEG; stored in S3 for immediate review.
  - Enables audit trail—"who picked up the package?"
- **Notifications**
  - Upon event, backend sends email to the student associated with that locker.
  - SMS notifications can be added for staff escalations or critical alerts.
- **Low‑Power Operation**
  - Deep sleep between events reduces average current draw to ~5 mA.
  - Battery life of ~3 weeks on a single 18650 cell, assuming ~10 accesses/day.

### 6.2 Limitations (v1 Prototype)

- **Single‑Compartment Focus**
  - Only monitors one door per module; scaling to multi‑compartment hubs requires adding multiple modules.
- **No Weight Sensor (Yet)**
  - Cannot differentiate "package delivered" vs. "student opened empty compartment."
  - Future versions will integrate a load cell for finer delivery detection.
- **Basic Authentication**
  - Prototype relies on device‑ID mapping; full campus directory integration (student IDs, LDAP) is pending.
- **Wi‑Fi Dependence**
  - Requires reliable campus Wi‑Fi; black spots or network changes can delay events.
  - Future builds will support fallback LTE or LoRa connectivity.

## 7. Benefits & Value Proposition

### 7.1 Enhanced Security

- Photo logs deter theft and provide evidence in case of disputes.
- Real‑time alerts ensure prompt retrieval, minimizing theft window.

### 7.2 Operational Efficiency

- Automates package tracking; reduces staff time spent searching or relabeling.
- Students retrieve items on their own schedule, easing mailroom traffic.

### 7.3 Cost‑Effective & Scalable

- Prototype cost ~$80 per module (ESP32‑CAM, battery, reed switch, enclosure).
- Campuses can deploy by the locker or mailbox—no large locker bank purchase needed.
- Scales horizontally: add modules as needed rather than replacing entire systems.

### 7.4 Improved Student Experience

- 24/7 visibility—no more "Where is my package?" calls.
- Simple mobile alerts (email/SMS) integrate with student routines.
- Potential to expand into food security (e.g. meal locker integrations).

## 8. Implementation Plan

| Phase                                 | Timeline   | Milestones                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1: Prototype Build & Validation | Weeks 1–4  | - Finalize prototype hardware: assemble ESP32‑CAM + reed switch + battery in 3D‑printed enclosure<br>- Develop & test firmware: reed + camera logic, HTTPS uploads<br>- Deploy cloud backend (Lambda + RDS + S3 + SES/SNS)<br>- Conduct bench tests (reliability, battery life)                                                                                     |
| Phase 2: Campus Pilot Deployment      | Weeks 5–8  | - Install 5 prototype modules in a selected campus mailroom or small locker hub<br>- Assign modules to volunteer students; collect feedback on notifications, images, and usability<br>- Monitor network reliability & battery performance<br>- Track key metrics: pickup time reduction, theft incidents averted                                                   |
| Phase 3: Feedback, Iterate, & Expand  | Weeks 9–12 | - Analyze pilot data; iterate on hardware (e.g., optimize battery, add LED indicators) and firmware (OTA updates, error handling)<br>- Develop multi‑module hub management (grouping devices under one "hub" ID)<br>- Integrate basic campus SSO/Clerk authentication for device registration<br>- Expand pilot to additional dorms or small campus stores          |
| Phase 4: Full‑Scale Campus Rollout    | Months 4–6 | - Finalize enclosure design for durability (metal or reinforced plastic) and tamper‑resistance<br>- Produce a 20‑unit run for dorms and mailrooms across campus<br>- Develop Next.js dashboard features: bulk device management, usage analytics, multi‑hub reporting<br>- Launch awareness campaign: posters in dorms, orientation events, email blast to students |

## 9. Future Roadmap & Extensions

### 9.1 Weight‑Based Delivery Detection

- Add a small load cell under the locker shelf. Differentiate "mail delivered" vs. "empty open."

### 9.2 Multi‑Compartment Hubs

- Combine up to eight modules under one backplane with a single Wi‑Fi/LTE bridge, reducing network overhead.

### 9.3 Temperature‑Controlled Compartments

- Offer "food lockers" with passive insulation or active cooling for meal deliveries, addressing campus late‑night food security.

### 9.4 Campus ID Integration

- Work with campus IT (Clerk or LDAP/SSO) to auto‑register students, assign them to specific modules, and unlock via mobile credential.

### 9.5 Analytics & Reporting

- Develop usage dashboards for mailroom staff: peak delivery times, average pickup latency, overall security events.

### 9.6 Networked Locker Zones

- Create a "Campus Locker Network" allowing students to retrieve packages from any participating drop point (e.g. dorms, student union, retail partner on campus).

### 9.7 Monetization Model

- Offer a locker‑as‑service subscription to Universities, with optional per‑use fees for students (e.g. after 48 hours of storage).
- Explore partnerships with delivery services (Amazon, Postmates) to guarantee drop location availability.

## 10. Conclusion

MailGuard's Smart Delivery Hub—anchored by a compact prototype box with a reed switch and camera—offers an immediate, low‑cost solution for California campuses combatting package and food theft. By delivering real‑time alerts, photo evidence, and a seamless cloud dashboard, we will greatly improve student satisfaction, reduce mailroom burdens, and enhance overall campus security. The implementation plan lays out a clear path from prototype validation to full‑scale rollout. With targeted execution and strategic campus partnerships, MailGuard can become the trusted standard for secure, efficient last‑mile delivery on college campuses across California.

For more information or to participate in the pilot, please contact the MailGuard team at team@mailguard.edu.

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
   pip install -r backend/requirements.txt -r backend/cdk/requirements.txt

   ```

# Configure environment variables - create .env file in backend/

# See backend/README.md for required variables

# Start the backend

cd backend
uvicorn main:app --reload --port 8000

````

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
````

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
