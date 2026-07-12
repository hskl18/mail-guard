# MailGuard Next.js Application

The core Next.js application for the MailGuard smart mailbox prototype.
It demonstrates authentication, monitoring, and device-management flows, but it is not a verified production deployment.

---

## 🏗️ Architecture Overview

### **Technology Stack**

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Authentication**: Clerk for secure user management
- **Database**: MySQL with connection pooling
- **Storage**: AWS S3 for secure image storage
- **Styling**: Tailwind CSS with shadcn/ui components
- **Email**: Resend for notification delivery
- **Security**: Multi-tier API authentication with rate limiting

### **Application Structure**

```
stack/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (Backend)
│   │   ├── iot/              # IoT Device Endpoints
│   │   │   ├── event/        # Core event processing
│   │   │   ├── upload/       # Image upload handling
│   │   │   ├── activate/     # Device registration
│   │   │   └── report/       # Legacy reporting
│   │   ├── devices/          # Device Management
│   │   ├── dashboard/        # Dashboard Data
│   │   ├── community-reports/# Community Features
│   │   ├── image/[id]/       # Secure Image Proxy
│   │   └── docs/             # API Documentation
│   ├── dashboard/            # Dashboard Pages
│   ├── connect-device/       # Device Onboarding
│   ├── delivery-hub/         # Delivery Management
│   ├── docs/                 # Documentation Pages
│   ├── (Auth)/               # Authentication Pages
│   ├── layout.tsx            # Root Layout
│   ├── page.tsx              # Landing Page
│   ├── globals.css           # Global Styles
│   └── not-found.tsx         # 404 Page
├── components/               # React Components
│   ├── ui/                   # shadcn/ui Base Components
│   ├── dashboard.tsx         # Main Dashboard (1089 lines)
│   ├── settings.tsx          # Device Settings (786 lines)
│   ├── notifications.tsx     # Notification Center (504 lines)
│   ├── committee.tsx         # Community Management (755 lines)
│   ├── landing-page.tsx      # Landing Page (660 lines)
│   ├── authenticated-app.tsx # App Shell (163 lines)
│   ├── client-provider.tsx   # Client Setup
│   └── user-nav.tsx          # User Navigation
├── lib/                      # Core Libraries
│   ├── api-security.ts       # Security System (481 lines)
│   ├── db.ts                 # Database Layer (150 lines)
│   ├── email.ts              # Email Service (199 lines)
│   ├── s3.ts                 # AWS S3 Integration (130 lines)
│   ├── types.ts              # TypeScript Definitions (119 lines)
│   └── utils.ts              # Utility Functions (7 lines)
├── hooks/                    # Custom React Hooks
├── styles/                   # Additional Stylesheets
├── public/                   # Static Assets
├── middleware.ts             # Next.js Middleware (52 lines)
└── Configuration Files
    ├── package.json          # Dependencies (78 lines)
    ├── tsconfig.json         # TypeScript Config
    ├── tailwind.config.ts    # Tailwind CSS Config
    ├── next.config.js        # Next.js Config (51 lines)
    ├── next.config.mjs       # Alternative Config (15 lines)
    ├── postcss.config.mjs    # PostCSS Config
    └── components.json       # shadcn/ui Config
```

---

## 🛡️ Security Implementation

### **Multi-Tier Authentication System**

#### **1. IoT Device Authentication** (`lib/api-security.ts`)

- **API Key Format**: `iot_` prefix + 64-character hex string
- **Rate Limiting**: 100 requests/hour per device
- **Device Verification**: Serial number validation against API key
- **Automatic Registration**: New devices auto-register with valid API keys

```typescript
// IoT Authentication Flow
const authResult = await authenticateIoTDevice(request);
if (!authResult.success) {
  logSecurityEvent("IOT_AUTH_FAILED", { error: authResult.error }, request);
  return createSecurityResponse("Authentication failed", 401);
}
```

#### **2. User Authentication** (Clerk Integration)

- **Session Management**: Secure JWT-based sessions
- **Rate Limiting**: 1000 requests/hour per user
- **Authorization**: Users can only access their own data
- **Protected Routes**: All dashboard routes require authentication

Database schema changes are not exposed through an admin HTTP endpoint.
Operators use the offline migration CLI from a trusted environment.

### **Security Features**

- **Rate Limiting**: Per-user/device request throttling
- **Input Validation**: Payload validation on supported routes
- **Authorization Checks**: Resource ownership verification
- **Audit Logging**: Security event logging helpers
- **CORS Protection**: Proper origin control
- **Security Headers**: XSS, clickjacking, and content-type protection

---

## 📡 API Endpoints

### **IoT Device Endpoints** (API Key Required)

#### `POST /api/iot/event` - Core Event Processing

**Purpose**: Primary endpoint for IoT devices to submit mailbox events

**Authentication**: IoT API Key required
**Rate Limit**: 100 requests/hour per device

**Request Body**:

```json
{
  "serial_number": "SN001234567",
  "event_data": {
    "reed_sensor": true,
    "event_type": "open",
    "weight_value": 125.5,
    "weight_threshold": 50
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "firmware_version": "1.2.0",
  "battery_level": 85,
  "signal_strength": -45
}
```

**Features**:

- Weight sensor integration
- Automatic event type inference
- Device health monitoring
- Email notifications
- Photo evidence linking

#### `POST /api/iot/upload` - Image Upload

**Purpose**: Secure image upload for photo evidence

**Authentication**: IoT API Key required
**Content Type**: `multipart/form-data`
**File Limits**: Max 10MB, images only

**Form Data**:

- `file`: Image file
- `serial_number`: Device serial
- `event_type`: Event type (delivery/mail_delivered)
- `timestamp`: Optional timestamp

#### `POST /api/iot/activate` - Device Registration

**Purpose**: IoT device registration and validation

**Features**:

- Automatic serial number creation
- Device status tracking
- Firmware version management

#### `GET /api/iot/report` - Legacy Reporting

**Purpose**: Simplified event reporting for legacy devices

**Query Parameters**:

- `d` or `device_name`: Device identifier
- `e`: Event code (o=open, c=close, d=delivery, r=removal)

### **User Dashboard Endpoints** (Clerk Auth Required)

#### `GET /api/dashboard` - Dashboard Data

**Purpose**: Dashboard data for the authenticated user

**Returns**:

- User devices with IoT status
- Recent events (dashboard + IoT)
- Recent images
- Notification count

#### `GET/POST /api/devices` - Device Management

**Purpose**: User device registration and management

**GET Features**:

- User's devices only
- Filter by name, status
- Device health information

**POST Features**:

- One device per user limit
- Serial number validation
- Automatic device configuration

#### `GET /api/image/[id]` - Secure Image Access

**Purpose**: Authorized image access with ownership verification

**Security**:

- User must own the device that captured the image
- Private caching headers
- S3 proxy for secure access

### **Community Endpoints** (Clerk Auth Required)

#### `GET/POST /api/community-reports` - Community Safety

**Purpose**: Community incident reporting and management

**Features**:

- Zip code-based filtering
- Status tracking (pending/reviewed/resolved)
- Image attachment support
- Input validation and sanitization

#### `PATCH /api/community-reports` - Report Management

**Purpose**: Update report status (for committee members)

### **Database Migrations**

Schema initialization is an offline operator action.
The migration uses idempotent table creation and never inserts sample users, devices, or administrator keys.

### **Documentation Endpoint**

#### `GET /api/docs` - API Documentation

**Purpose**: Interactive Swagger UI documentation

**Features**:

- Prototype API specification
- Interactive testing interface
- Authentication examples
- Response schemas

---

## 🎨 Frontend Components

### **Core Components**

#### `components/dashboard.tsx` (1089 lines)

**Purpose**: Main dashboard interface with real-time monitoring

**Features**:

- Device status display
- Event timeline
- Battery monitoring
- Photo gallery
- Real-time updates

#### `components/settings.tsx` (786 lines)

**Purpose**: Device configuration

**Features**:

- Notification preferences
- Device configuration
- WiFi management
- Account settings
- Security settings

#### `components/notifications.tsx` (504 lines)

**Purpose**: Notification center with filtering

**Features**:

- Event notifications
- Image viewing
- Filter by type/date
- Mark as read
- Email preferences

#### `components/committee.tsx` (755 lines)

**Purpose**: Community management interface

**Features**:

- Community reports
- Report status management
- Community statistics
- Committee tools

#### `components/landing-page.tsx` (660 lines)

**Purpose**: Marketing and information landing page

**Features**:

- Product showcase
- Feature highlights
- Pricing information
- Getting started guide

### **UI Components** (`components/ui/`)

- shadcn/ui component set
- Consistent design system
- Accessible components
- Dark/light mode support

---

## 🗄️ Database Layer

### **Core Functions** (`lib/db.ts`)

#### `executeQuery<T>(query: string, params?: any[])`

**Purpose**: Type-safe database query execution

**Features**:

- Connection pooling
- SSL support
- Error handling
- TypeScript generics

**Usage**:

```typescript
const devices = await executeQuery<Device[]>(
  "SELECT * FROM devices WHERE clerk_id = ?",
  [userId]
);
```

### **Database Tables**

#### **Security Tables**

- `api_keys`: API key management with hashing
- `security_events`: Security event records

#### **Device Tables**

- `device_serials`: Valid device serial numbers
- `iot_device_status`: Runtime device status
- `devices`: User-registered dashboard devices

#### **Event Tables**

- `events`: Dashboard device events
- `iot_events`: Unclaimed device events
- `images`: Dashboard device images
- `iot_images`: Unclaimed device images

#### **User Tables**

- `notifications`: User notifications
- `device_health`: Device health metrics
- `community_reports`: Community safety reports

---

## ☁️ External Integrations

### **AWS S3 Integration** (`lib/s3.ts`)

#### `uploadToS3(buffer: Buffer, key: string, contentType: string)`

**Purpose**: Secure image upload to S3

**Features**:

- Automatic content type detection
- Unique file naming
- Error handling
- Metadata tagging

#### `getFromS3(key: string)`

**Purpose**: Secure image retrieval from S3

**Features**:

- Stream handling
- Error handling
- Content type preservation

### **Email Service** (`lib/email.ts`)

#### `sendEventNotification(params: NotificationParams)`

**Purpose**: Event-based email notifications

**Features**:

- HTML email templates
- Image attachments
- Error handling
- Delivery tracking

#### **Email Templates**:

- Mail delivery notifications
- Mailbox access alerts
- Battery level warnings
- Security incident reports

### **Clerk Authentication**

- User registration and login
- Session management
- User profile management
- Protected route handling

---

## 🔧 Configuration & Setup

### **Environment Variables**

#### **Required Variables**:

```env
# Database
DATABASE_URL=mysql://user:pass@host:port/database
MYSQL_SSL_CA=path/to/ca-cert.pem

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=your-mailguard-bucket

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME="Mail Guard"

# Security
API_ENCRYPTION_SECRET=your-encryption-secret
COMMITTEE_REVIEWER_IDS=user_example

# Offline migration controls
DATABASE_MIGRATION_CONFIRM=
DATABASE_MIGRATION_TARGET=

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### **Development Setup**

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Preview schema changes without connecting to a database
pnpm db:migrate -- --dry-run

# Apply from a trusted operator shell after reviewing the dry run
DATABASE_MIGRATION_CONFIRM=apply DATABASE_MIGRATION_TARGET=host/database pnpm db:migrate -- --apply

# Start development server
pnpm dev
```

### **Production Deployment**

#### **Build Process**:

```bash
pnpm build    # TypeScript compilation & optimization
pnpm start    # Production server
```

#### **Deployment Platforms**:

- **Vercel**: Automatic preview deployments
- **Railway**: Container-based deployment
- **DigitalOcean App Platform**: Managed hosting
- **AWS Amplify**: Full-stack hosting

### **Configuration Files**

#### `next.config.js` - Next.js Configuration

**Features**:

- Bundle optimization
- Image domains configuration
- Webpack customization
- Performance optimization

#### `middleware.ts` - Request Middleware

**Features**:

- CORS headers for API routes
- Protected route handling
- Request preprocessing

#### `tailwind.config.ts` - Styling Configuration

**Features**:

- Custom color scheme
- Component styles
- Responsive breakpoints
- Dark mode support

---

## 🧪 Testing & Validation

### **API Testing**

```bash
cd ../api_test
python test_iot_data.py
```

### **Security Testing**

- Rate limit validation
- Authentication bypass testing
- Authorization verification
- Input validation testing
- CORS policy testing

### **Performance Testing**

- Database query optimization
- Image upload performance
- API response times
- Frontend rendering performance

---

## 📈 Performance & Optimization

### **Bundle Optimization**

- Code splitting for efficient loading
- AWS SDK optimization
- MySQL client optimization
- Tree shaking for unused code

### **Database Optimization**

- Connection pooling
- Query optimization
- Index usage
- SSL connections

### **Image Optimization**

- WebP format support
- Responsive image loading
- S3 CDN integration
- Secure image proxy

---

## 🚀 Deployment Guide

### **Environment Setup**

1. **Database Setup** (Aiven MySQL):

   - Create MySQL database
   - Configure SSL certificates
   - Set up connection pooling

2. **Storage Setup** (AWS S3):

   - Create S3 bucket
   - Configure CORS policy
   - Set up IAM user with S3 access

3. **Authentication Setup** (Clerk):

   - Create Clerk application
   - Configure authentication providers
   - Set up webhooks (optional)

4. **Email Setup** (Resend):
   - Create a Resend account
   - Verify sending domain
   - Generate API key

### **Production Checklist**

- ⬜ Environment variables configured
- ⬜ Offline database migration reviewed and applied
- ⬜ S3 bucket and IAM configured
- ⬜ Clerk authentication configured
- ⬜ Resend domain verified
- ⬜ Database CA certificate installed
- ⬜ Security controls reviewed for the target environment
- ⬜ Distributed rate limiting configured
- ⬜ Error monitoring set up

---

## 📊 Monitoring & Analytics

### **Built-in Monitoring**

- Security event logging
- Authentication tracking
- API usage metrics
- Error tracking

### **Recommended External Tools**

- **Vercel Analytics**: Performance monitoring
- **Sentry**: Error tracking
- **LogRocket**: User session recording
- **Mixpanel**: User analytics

---

## 🔄 Maintenance & Updates

### **Regular Maintenance**

- Security event log review
- Database performance monitoring
- API usage analysis
- User feedback review

### **Update Process**

- Dependency updates
- Security patches
- Feature additions
- Bug fixes

---

## 📞 Support & Documentation

- **API Documentation**: `/api/docs` (Interactive Swagger UI)
- **Component Storybook**: Coming soon
- **Developer Guide**: This README
- **Security Guide**: See main repository README

---

**Built with Next.js 15 and TypeScript as an evolving security-system prototype.**
