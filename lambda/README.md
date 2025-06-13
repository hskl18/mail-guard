# ⚠️ DEPRECATED: AWS Lambda Backend

**STATUS: DEPRECATED**

This directory contains the legacy AWS Lambda backend implementation that has been **superseded by the Next.js API routes** in the `/stack` directory.

---

## 🚨 Migration Notice

**The Lambda backend is no longer maintained or recommended.** All API functionality has been migrated to Next.js API routes with enhanced security features.

### **Why We Migrated**

1. **Performance**: Lambda cold starts were too slow for real-time IoT communication
2. **Complexity**: Managing separate backend infrastructure added unnecessary complexity
3. **Cost**: Next.js API routes are more cost-effective for our use case
4. **Security**: Integrated authentication and rate limiting in Next.js
5. **Maintenance**: Single codebase is easier to maintain and deploy

### **Current Architecture**

```
Old Architecture (Deprecated):
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ IoT Devices │───▶│ AWS Lambda  │───▶│ MySQL + S3  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                   ┌─────────────┐
                   │ Next.js SPA │
                   └─────────────┘

New Architecture (Current):
┌─────────────┐    ┌─────────────────────────────────┐
│ IoT Devices │───▶│        Next.js Fullstack        │───▶│ MySQL + S3  │
└─────────────┘    │  ├── API Routes (Backend)       │    └─────────────┘
                   │  ├── React Pages (Frontend)     │
                   │  ├── Authentication (Clerk)     │
                   │  └── Security (Multi-tier)      │
                   └─────────────────────────────────┘
```

---

## 📁 Legacy Code Structure

This directory contains the following **deprecated** components:

```
lambda/
├── main.py                   # FastAPI application (1205 lines)
├── requirements.txt          # Python dependencies (8 lines)
├── docker-compose.yml        # Local development (12 lines)
├── Dockerfile.lambda         # Lambda container (15 lines)
├── cdk/                      # AWS CDK infrastructure
├── esstential.txt            # Empty file (0 lines)
└── README.md                 # This documentation
```

### **Legacy Endpoints (No Longer Active)**

The following endpoints were provided by the Lambda backend but are **no longer functional**:

- `POST /events` → Now: `POST /api/iot/event`
- `POST /upload` → Now: `POST /api/iot/upload`
- `GET /devices` → Now: `GET /api/devices`
- `POST /devices` → Now: `POST /api/devices`
- `GET /images/{id}` → Now: `GET /api/image/[id]`

---

## 🔄 Migration Guide

If you have IoT devices still pointing to the old Lambda endpoints, **update them immediately**:

### **Old Configuration** (Deprecated)

```env
# DON'T USE - No longer works
API_BASE_URL=https://old-lambda-api.amazonaws.com
```

### **New Configuration** (Current)

```env
# Use this instead
API_BASE_URL=https://mail-guard-ten.vercel.app
IOT_API_KEY=iot_your_device_api_key_here
```

### **Update Device Firmware**

1. **Update API endpoints** in device firmware:

   ```cpp
   // Old (deprecated)
   String endpoint = "https://old-lambda-api.amazonaws.com/events";

   // New (current)
   String endpoint = "https://mail-guard-ten.vercel.app/api/iot/event";
   ```

2. **Add API key authentication**:

   ```cpp
   // Add to HTTP headers
   http.addHeader("Authorization", "Bearer " + API_KEY);
   // or
   http.addHeader("X-API-Key", API_KEY);
   ```

3. **Update request format** if needed (most endpoints are compatible)

---

## 🗑️ Cleanup Instructions

### **For Developers**

If you're setting up a new development environment:

1. **Ignore this directory** - Focus on `/stack` instead
2. **Use Next.js API routes** for all backend functionality
3. **Follow the security guidelines** in `/stack/lib/api-security.ts`

### **For Existing Deployments**

If you have legacy Lambda infrastructure:

1. **Migrate all IoT devices** to new API endpoints
2. **Update any external integrations** to use new URLs
3. **Shut down Lambda functions** once migration is complete
4. **Remove AWS CDK stacks** to avoid ongoing costs

---

## 📚 Legacy Documentation

### **What This Directory Contained**

#### **main.py** (1205 lines - Deprecated)

- FastAPI application with basic endpoints
- MySQL integration without connection pooling
- S3 upload functionality
- Basic CORS handling
- **Missing**: Authentication, rate limiting, security logging

#### **Docker & CDK Infrastructure**

- AWS Lambda deployment configuration
- Docker containerization for Lambda
- CDK infrastructure as code
- **Status**: All deprecated in favor of Vercel deployment

### **Why It Was Insufficient**

1. **No Authentication**: Lambda endpoints were completely open
2. **No Rate Limiting**: Vulnerable to abuse and DoS attacks
3. **Cold Start Issues**: 3-5 second delays for first requests
4. **Complex Deployment**: Required AWS CDK knowledge and setup
5. **Split Codebase**: Backend and frontend in separate repositories
6. **Limited Error Handling**: Basic error responses without logging

---

## ✅ Current Advantages (Next.js)

The new Next.js implementation provides:

### **Security**

- ✅ Multi-tier API authentication (IoT, User, Admin)
- ✅ Rate limiting per API key type
- ✅ Comprehensive audit logging
- ✅ Input validation and sanitization
- ✅ CORS protection and security headers

### **Performance**

- ✅ No cold starts - instant response times
- ✅ Connection pooling for database
- ✅ Optimized image handling
- ✅ CDN integration via Vercel

### **Developer Experience**

- ✅ Single codebase for frontend and backend
- ✅ TypeScript throughout the stack
- ✅ Hot reload in development
- ✅ Automatic deployments via Git
- ✅ Built-in API documentation

### **Deployment**

- ✅ Zero-config deployment to Vercel
- ✅ Automatic HTTPS and CDN
- ✅ Environment variable management
- ✅ Easy rollbacks and preview deployments

---

## 🚫 Do Not Use

**This Lambda implementation should not be used for:**

- New deployments
- Production environments
- Development environments
- Any real IoT devices

**Use the Next.js implementation in `/stack` instead.**

---

## 📞 Support

If you need help migrating from the Lambda backend:

1. **See Migration Guide** above for device updates
2. **Check Stack Documentation** in `/stack/README.md`
3. **API Documentation** at `/api/docs` on your Next.js deployment
4. **Open GitHub Issue** for migration assistance

---

**⚡ The future is serverless, but with better architecture! Use Next.js API routes for optimal performance and developer experience.**
