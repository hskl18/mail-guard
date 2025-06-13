# MailGuard – Smart IoT Cluster Mailbox Security System

[![Security Status](https://img.shields.io/badge/Security-Enterprise%20Grade-green.svg)](https://github.com/hskl18/mail-guard)
[![API Documentation](https://img.shields.io/badge/API-Documented-blue.svg)](https://mail-guard-ten.vercel.app/api/docs)
[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://mail-guard-ten.vercel.app/)

Welcome to **MailGuard**, an enterprise-grade IoT cluster mailbox monitoring system designed to secure package deliveries and prevent mail theft in residential communities. This comprehensive security platform provides real-time monitoring, photo evidence capture, and instant notifications through a modern web dashboard.

---

## 🌟 System Overview

MailGuard is a **complete IoT security ecosystem** that transforms standard cluster mailboxes into smart, monitored security systems:

📦 **Real-Time Event Monitoring** - Track every mailbox access, delivery, and removal  
📸 **Automated Photo Capture** - Visual evidence for every security event  
🔔 **Instant Multi-Channel Notifications** - Email alerts and dashboard updates  
🛡️ **Enterprise Security** - API key authentication, rate limiting, and audit logging  
🌐 **Cloud-Native Architecture** - Scalable Next.js fullstack application  
📊 **Comprehensive Analytics** - Dashboard with device health and event history

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  IoT Hardware   │    │  Next.js Stack  │    │   External      │
│                 │    │                 │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ ESP32-CAM       │───▶│ API Security    │───▶│ AWS S3          │
│ Reed Switch     │    │ Rate Limiting   │    │ Image Storage   │
│ Weight Sensor   │    │ Authentication  │    │                 │
│ Battery Monitor │    │                 │    │                 │
│                 │    │ Database Layer  │───▶│ Email Service   │
│ HTTPS/WiFi      │    │ MySQL (Aiven)   │    │                 │
│                 │    │                 │    │ Clerk Auth      │
│                 │    │ Dashboard UI    │───▶│ User Management │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Component Architecture**

- **IoT Layer**: ESP32-based hardware with sensors and camera
- **Security Layer**: Multi-tier API authentication with rate limiting
- **Application Layer**: Next.js 15 with App Router and TypeScript
- **Data Layer**: MySQL database with audit logging
- **Storage Layer**: AWS S3 for secure image storage
- **Communication Layer**: Real-time notifications via MailerSend

---

## 📦 Repository Structure

```
mail-guard/
├── stack/                    # Next.js fullstack application
│   ├── app/                  # App Router - pages & API routes
│   │   ├── api/              # Secured API endpoints
│   │   │   ├── iot/          # IoT device endpoints (API key auth)
│   │   │   ├── devices/      # Device management (user auth)
│   │   │   ├── dashboard/    # Dashboard data (user auth)
│   │   │   ├── community-reports/ # Community features
│   │   │   ├── image/        # Secure image proxy
│   │   │   └── init-db/      # Database setup (admin auth)
│   │   ├── dashboard/        # User dashboard pages
│   │   ├── connect-device/   # Device onboarding
│   │   └── (Auth)/           # Authentication pages
│   ├── components/           # React UI components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── dashboard.tsx     # Main dashboard component
│   │   ├── settings.tsx      # Device settings
│   │   ├── notifications.tsx # Notification center
│   │   └── committee.tsx     # Community management
│   ├── lib/                  # Core utilities and services
│   │   ├── api-security.ts   # Enterprise security system
│   │   ├── db.ts             # Database connection & queries
│   │   ├── email.ts          # Email notification service
│   │   ├── s3.ts             # AWS S3 integration
│   │   ├── types.ts          # TypeScript definitions
│   │   └── utils.ts          # Helper utilities
│   └── middleware.ts         # Next.js middleware (CORS, auth)
├── IOT/                      # ESP32 firmware
│   ├── src/                  # Main firmware code
│   ├── include/              # Header files
│   ├── platformio.ini        # PlatformIO configuration
│   └── README.md             # Hardware setup guide
├── api_test/                 # API testing utilities
│   ├── test_iot_data.py      # IoT endpoint testing
│   └── demo.jpg              # Test image data
├── lambda/                   # Legacy AWS Lambda (deprecated)
└── README.md                 # This file
```

---

## 🛡️ Security Features

### **Enterprise-Grade API Security**

- **Multi-Tier Authentication**:

  - IoT devices: API key authentication with device serial verification
  - Users: Clerk-based authentication with session management
  - Admins: High-security API keys for system administration

- **Rate Limiting**:

  - IoT devices: 100 requests/hour per device
  - Users: 1000 requests/hour per user
  - Admins: 10000 requests/hour per admin

- **Data Protection**:

  - Users can only access their own devices and images
  - Device ownership verification for all operations
  - Secure image proxy with authorization checks

- **Audit & Monitoring**:
  - Comprehensive security event logging
  - Authentication attempt tracking
  - Unauthorized access detection and alerting

### **API Security Implementation**

```typescript
// Example: IoT device authentication
const authResult = await authenticateIoTDevice(request);
if (!authResult.success) {
  logSecurityEvent("IOT_AUTH_FAILED", { error: authResult.error }, request);
  return createSecurityResponse("Authentication failed", 401);
}
```

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and pnpm
- MySQL database (Aiven recommended)
- AWS S3 bucket for image storage
- Clerk account for authentication
- MailerSend account for notifications

### **Environment Setup**

Create `.env.local` in `/stack/`:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard

MYSQL_HOST=
MYSQL_PORT=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
MYSQL_SSL_CA=/certs/rds-ca.pem
DATABASE_URL=mysql://user:pass@host:port/database

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=your-mailguard-bucket

# Notifications
RESEND_API_KEY=mlsn...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME="Mail Guard Security"

# Security
IOT_API_SECRET_KEY=your-iot-secret
ADMIN_API_SECRET_KEY=your-admin-secret
API_ENCRYPTION_SECRET=your-encryption-secret

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### **Installation**

```bash
# Clone repository
git clone https://github.com/yourusername/mail-guard.git
cd mail-guard/stack

# Install dependencies
pnpm install

# Initialize database (requires admin API key)
curl -X POST http://localhost:3000/api/init-db \
  -H "Authorization: Bearer admin_your_admin_api_key"

# Start development server
pnpm dev
```

### **Production Deployment**

```bash
# Build for production
pnpm build

# Deploy to Vercel (recommended)
vercel --prod

# Or deploy to any Node.js hosting
pnpm start
```

---

## 📱 Features & Components

### **Dashboard (`/dashboard`)**

- Real-time device status monitoring
- Event timeline with photo evidence
- Battery and connectivity alerts
- Device health metrics

### **Device Management (`/connect-device`)**

- Secure device registration
- Serial number validation
- API key generation for IoT devices
- Device configuration management

### **Notifications (`/notifications`)**

- Real-time event notifications
- Email alert preferences
- Photo evidence viewing
- Notification filtering and search

### **Settings (`/settings`)**

- Device configuration
- Notification preferences
- User account management
- Security settings

### **Community Features (`/community`)**

- Community safety reports
- Neighborhood incident tracking
- Committee management tools

---

## 🔧 API Documentation

### **Live API Documentation**

- **Swagger UI**: [https://mail-guard-ten.vercel.app/api/docs](https://mail-guard-ten.vercel.app/api/docs)
- **Interactive Testing**: Full API testing interface with authentication

### **Key Endpoints**

#### **IoT Device Endpoints** (API Key Required)

```
POST /api/iot/event         # Submit mailbox events
POST /api/iot/upload        # Upload security photos
POST /api/iot/activate      # Device registration
GET  /api/iot/report        # Legacy device reporting
```

#### **User Dashboard Endpoints** (Clerk Auth Required)

```
GET  /api/dashboard         # Dashboard data
GET  /api/devices           # User devices
POST /api/devices           # Register new device
GET  /api/image/[id]        # Secure image access
```

#### **Community Endpoints** (Clerk Auth Required)

```
GET  /api/community-reports # View community reports
POST /api/community-reports # Submit safety report
PATCH /api/community-reports # Update report status
```

#### **Admin Endpoints** (Admin API Key Required)

```
POST /api/init-db           # Initialize database
```

---

## 🔌 IoT Hardware Integration

### **Supported Hardware**

- ESP32-CAM with OV2640 camera
- Magnetic reed switches for door detection
- HX711 load cell amplifier for weight sensing
- Battery monitoring with low-power modes

### **Firmware Features**

- Secure HTTPS communication with API
- Automatic device registration
- Photo capture and upload
- Battery optimization
- WiFi credential management

### **Hardware Setup**

See [IOT/README.md](IOT/README.md) for complete hardware setup instructions.

---

## 🧪 Testing

### **API Testing**

```bash
cd api_test
python test_iot_data.py
```

### **Security Testing**

- Rate limiting validation
- Authentication bypass testing
- Authorization verification
- Input validation testing

---

## 🌐 Live Demo

- **Production Dashboard**: [https://mail-guard-ten.vercel.app/](https://mail-guard-ten.vercel.app/)
- **API Documentation**: [https://mail-guard-ten.vercel.app/api/docs](https://mail-guard-ten.vercel.app/api/docs)

### **Demo Features**

- Guest user registration
- Sample device simulation
- Live API testing interface
- Security feature demonstration

---

## 🎯 Target Market

### **Primary Markets**

1. **Residential Communities & HOAs** - Cluster mailbox security for neighborhoods and apartment complexes
2. **Property Management Companies** - Reduce liability and improve resident satisfaction
3. **Mail Service Providers** - Enhanced security for delivery points

### **Use Cases**

- Package theft prevention
- Mail delivery verification
- Community security monitoring
- Property management compliance
- Insurance claims with photo evidence

---

## 📈 Current Status

### **✅ Production Ready Features**

- Complete security implementation
- User authentication and authorization
- Device management and monitoring
- Photo capture and storage
- Email notification system
- Community reporting features
- Comprehensive API documentation

### **🔧 In Development**

- Mobile app development
- Advanced analytics dashboard
- Machine learning for delivery patterns
- Integration with delivery services
- Solar charging optimization

---

## 🔮 Future Roadmap

### **Phase 1: Enhanced Analytics** (Q1 2024)

- Delivery pattern analysis
- Security incident trending
- Community safety metrics
- Advanced reporting dashboards

### **Phase 2: Mobile & Integrations** (Q2 2024)

- Native iOS/Android applications
- Delivery service integrations (FedEx, UPS, USPS)
- Smart doorbell compatibility
- Voice assistant integration

### **Phase 3: AI & Automation** (Q3 2024)

- Computer vision for package detection
- Predictive analytics for theft prevention
- Automated incident response
- Advanced security pattern recognition

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details on:

- Code style and standards
- Security requirements
- Testing procedures
- Documentation standards

---

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/mail-guard/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/mail-guard/issues)
- **Security**: security@mailguard.com
- **General**: support@mailguard.com

---

**MailGuard** - Securing communities, one mailbox at a time. 🛡️📮
