# Mini ERP + CRM Operations Portal

> A full-stack, multi-tenant SaaS operations portal for wholesale/distribution businesses built with Node.js, TypeScript, Express, MySQL, and React.

[![CI Build Check](https://github.com/AbhiNav-3007/mini-erp-crm-portal/actions/workflows/deploy.yml/badge.svg)](https://github.com/AbhiNav-3007/mini-erp-crm-portal/actions/workflows/deploy.yml)

---

## Live Deployment

| Service | URL |
|---|---|
| **Frontend (Vercel)** | https://mini-erp-crm-portal-coral.vercel.app |
| **Backend API (Railway)** | https://mini-erp-crm-portal-production-375b.up.railway.app |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MySQL 9.4 |
| **Authentication** | JWT Bearer tokens with company_id tenant payload |
| **CI/CD** | GitHub Actions - automated build check on every push to main |
| **Deployment** | Vercel (Frontend) + Railway (Backend + MySQL Docker container) |
| **Containerisation** | Docker, Docker Compose |

---

## Architecture Overview

`
React Frontend  (Vercel - auto-deploy from GitHub)
        |
        |  REST API calls with Bearer JWT token
        v
Express Backend  (Railway - Node.js + TypeScript)
  |- JWT middleware  extracts: employee_id, role, company_id
  |- RBAC middleware enforces role-based route access
  |- All DB queries filtered: WHERE company_id = <tenant>
        |
        v
MySQL 9.4 Database  (Railway - Docker container + persistent volume)
`

The frontend communicates with the backend through REST APIs only.
Every protected API call carries a JWT token containing employee_id, role, and company_id.
The backend enforces RBAC and multi-tenant isolation (company_id scoping) on every database query.
GitHub Actions runs automated build checks on every push to main, confirming both the TypeScript backend and Vite frontend compile correctly before deployment.

---

## Core Modules

| Module | Roles with Access |
|---|---|
| Authentication and RBAC | All roles |
| Employee Management | Admin |
| Customer CRM + Follow-up Notes | Admin, Sales, Accounts |
| Product Catalog + Inventory | Admin, Warehouse |
| Stock Movement Ledger | Admin, Warehouse |
| Sales Challans + PDF Export | Admin, Sales, Accounts |
| System Audit Log | Admin |
| Multi-Tenant Company Registration | Public (unauthenticated) |

---

## Test Credentials

### Step 1 - Register a Company (first time only)
1. Open the live frontend URL
2. Click **Activate Account** in the header, switch to **Register Company** tab
3. Enter a company name (e.g. Test Company) and create an Admin profile
4. Note the **Company ID** returned (e.g. 1) - required for all logins

### Step 2 - Activate Employees
Admin pre-creates employees from the Admin dashboard. Each employee activates via Activate Account > Activate Employee using their Company ID, Employee ID, name, role, joining date, and a new password.

### Employee ID Prefix Convention

| Role | ID Format | Example |
|---|---|---|
| Admin | AD-XXX | AD-001 |
| Sales | SL-XXX | SL-001 |
| Warehouse | WH-XXX | WH-001 |
| Accounts | AC-XXX | AC-001 |

### Login
All users log in with Employee ID + Password + Company ID (the unique number from registration).

---

## API Documentation - Postman Collection

The complete Postman collection is included in this repository:

File: docs/ERP_CRM_Portal.postman_collection.json

### How to import
1. Open Postman > click Import
2. Select docs/ERP_CRM_Portal.postman_collection.json
3. All endpoints load, grouped by module

### Key API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register-company | None | Register new business tenant |
| POST | /api/auth/activate | None | Activate employee account |
| POST | /api/auth/login | None | Login - returns JWT |
| GET | /api/employees | Admin | List all company employees |
| POST | /api/employees | Admin | Pre-register new employee |
| DELETE | /api/employees/:id | Admin | Remove employee |
| GET | /api/customers | Admin, Sales, Accounts | List customers with search and filter |
| POST | /api/customers | Admin, Sales | Add customer |
| PUT | /api/customers/:id | Admin, Sales | Edit customer |
| POST | /api/customers/:id/notes | Admin, Sales | Add follow-up note |
| GET | /api/products | Admin, Warehouse | List products |
| POST | /api/products | Admin, Warehouse | Add product |
| PUT | /api/products/:id | Admin, Warehouse | Edit product |
| POST | /api/products/:id/stock | Admin, Warehouse | Record stock IN movement |
| GET | /api/challans | Admin, Sales, Accounts | List challans |
| POST | /api/challans | Sales | Create draft challan |
| POST | /api/challans/:id/confirm | Admin, Sales | Confirm and deduct stock |
| POST | /api/challans/:id/cancel | Admin, Sales | Cancel challan |
| GET | /api/stock-movements | Admin, Warehouse | View stock movement ledger |
| GET | /api/audit-logs | Admin | View system audit trail |

All protected routes require: Authorization: Bearer <token> in the request header.

---

## Local Setup and Running

### Option A - Docker Compose (Recommended)

Runs MySQL, backend, and frontend in one command with no manual database setup.

`ash
# Clone the repository
git clone https://github.com/AbhiNav-3007/mini-erp-crm-portal.git
cd mini-erp-crm-portal

# Build and start all services
docker-compose up --build

# Open in browser
http://localhost:5173
`

MySQL data is persisted via a Docker volume and survives container restarts.

---

### Option B - Manual Setup

#### 1. Database

Install MySQL locally, create the database and import the schema:
`sql
CREATE DATABASE erp_crm_db;
`
`ash
mysql -u root -p erp_crm_db < backend/schema.sql
`

#### 2. Backend

`ash
cd backend
`

Create a .env file (use .env.example as reference):
`
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=erp_crm_db
DB_PORT=3306
JWT_SECRET=your_secure_random_secret
FRONTEND_URL=http://localhost:5173
`

Install and start:
`ash
npm install
npm run build
npm start
`

Backend runs at: http://localhost:5001

#### 3. Frontend

`ash
cd frontend
`

Create a .env file:
`
VITE_API_URL=http://localhost:5001
`

Install and run:
`ash
npm install
npm run dev
`

Frontend runs at: http://localhost:5173

---

## Deployment Guide

### Frontend - Vercel

1. Go to vercel.com and import the GitHub repository
2. Set Root Directory: frontend/
3. Build Command: npm run build
4. Add environment variable: VITE_API_URL = https://your-railway-backend-url.up.railway.app
5. Deploy - Vercel auto-redeploys on every push to main

### Backend + Database - Railway

1. Go to railway.app and create a new project
2. Add GitHub repo service with root set to backend/
3. Add a MySQL service with a persistent volume
4. Set environment variables on the backend service:
`
PORT=5001
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=<railway-generated>
DB_NAME=railway
DB_PORT=3306
JWT_SECRET=your_secure_random_secret
FRONTEND_URL=https://your-vercel-url.vercel.app
`
5. Deploy - Railway auto-redeploys on every push to main

IMPORTANT: DB_HOST must be mysql.railway.internal and not localhost.
Railway services communicate via internal private networking.

---

## Known Limitations and Incomplete Parts

- **No password reset flow**: Employees must contact Admin if they lose access. No email-based recovery is implemented.
- **No automated test suite**: The application is validated manually and through GitHub Actions build checks (TypeScript compile + Vite production build).
- **Single-region deployment**: Hosted on Railway US West region. No CDN or global distribution layer is in place.
- **No product image upload**: Product catalog stores text metadata only. AWS S3 image upload is not implemented.
- **No refresh token mechanism**: JWT sessions expire after the set TTL period. Users must log in again after expiry or when the browser tab closes.

---

## Assumptions Made

- Each company has at least one Admin who pre-creates all employee records before employees can activate their accounts.
- Employee IDs must follow the prefix naming convention (AD-, SL-, WH-, AC-). The system validates this prefix against the selected role on activation.
- Stock cannot go below zero. Challan confirmation is blocked if any product has insufficient quantity.
- All monetary values are stored in INR with 2-decimal precision using DECIMAL(10,2).
- Company names do not need to be unique. Only the auto-generated numeric Company ID is guaranteed unique across all tenants.
