# Mini ERP + CRM Operations Portal

A premium, modern, and highly secure full-stack **multi-tenant SaaS** enterprise operations portal. Any business can register their company, onboard employees, and manage their operations completely isolated from every other tenant — all on a single shared platform.

### 🔗 Live Deployments
* **Frontend Portal (Vercel):** [https://mini-erp-crm-portal-coral.vercel.app](https://mini-erp-crm-portal-coral.vercel.app)
* **Backend API (Railway):** [https://mini-erp-crm-portal-production-375b.up.railway.app](https://mini-erp-crm-portal-production-375b.up.railway.app)

---

## 📸 Screenshots

### 1. Operations Portal Home Page (Light & Dark Theme Side-by-Side)
![Home Page Light & Dark Combined](docs/screenshots/landing_combined.png)

### 2. Sign In Console & Credentials
![Sign In Console](docs/screenshots/signin_dark.png)

### 3. Dashboard Summary (Central Metrics Console)
![Admin Dashboard](docs/screenshots/dashboard_dark.png)

### 4. Customers CRM Directory (with Activity Logs)
![Customers CRM](docs/screenshots/customer_crm_dark.png)

### 5. Sales Challan Registry & Invoicing Details
![Sales Challans](docs/screenshots/challan_draft_dark.png)

### 6. Invoice PDF Print Preview (Professional Layout)
![Invoice Print Preview](docs/screenshots/challan_print_preview.png)

### 7. System Audits (Database Change Ledger)
![System Auditing](docs/screenshots/audit_trail_dark.png)

---

## 🌟 Key Features

### 1. Multi-Tenant SaaS Architecture
The system supports unlimited business tenants on a single shared database, with complete data isolation:
* **Company Registration:** Any new business registers via the **Activate Account → Register Company** tab. They receive a unique Company ID.
* **Tenant Scoping:** Every database query is scoped by `company_id` extracted from the user's JWT. Company A can never see Company B's data.
* **Unique Company IDs:** Even if two companies share the same name (e.g., "Apex Logistics"), their auto-increment Company ID is always unique and forms the basis of all data separation.

### 2. Unified Onboarding (Single Entry Point)
The **Activate Account** page serves two purposes via a clean tab-switcher:
* **Activate Employee** — existing employees enter their Company ID + Employee ID to set up their login credentials.
* **Register Company** — new business owners register their company and set up the initial Admin account in one step.

### 3. Multi-Profile Role-Based Access Control (RBAC)
Tailored operational modules depending on the logged-in role:
* **Admin:** Full system control, employee roster management, pre-registration, audit logs.
* **Sales:** Customer database management, follow-up logging, issuing draft/confirmed challans.
* **Warehouse:** Product inventory catalog, stock updates, stock movement history.
* **Accounts:** Confirming/cancelling challans, reviewing customer balances, logging adjustments.

### 4. Automated Employee Pre-Registration
* Admin pre-registers staff directly from the Admin console.
* When employees activate with their **Company ID, Employee ID, Name, Role, and Joining Date** matching the pre-registered record, their account is activated instantly without secondary approval.

### 5. Advanced Security & Compliance
* **Session Protection:** `sessionStorage` — auto logout when the browser tab closes.
* **Idle Timeout:** Auto logout after **60 seconds of absolute inactivity** (monitors mouse, keys, clicks, scroll).
* **Password Encryption:** Hashed using `bcrypt`, verified via JSON Web Tokens (JWT).
* **Tenant Isolation:** All API routes enforce `company_id` scoping via JWT middleware.

### 6. Sales Challans & Inventory Lifecycle
* Draft challan creation with line-item totals.
* **Confirming** a challan automatically deducts quantities from product inventory.
* **Cancelling** safely returns or retains inventory stock.
* Invoices can be exported to clean PDFs instantly.

### 7. Interactive System Auditing
* Every update to Customers, Products, or Challans creates a traceable entry in the **System Audits** log (table name, changed field, old value, new value, who modified it, timestamp).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, Tailwind CSS (custom dark/light themes) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (multi-tenant, `company_id` scoped) |
| **Auth** | JWT (Bearer tokens with tenant payload) |
| **Deployment** | Vercel (Frontend), Railway (Backend + PostgreSQL) |
| **Containerisation** | Docker, Docker Compose |

---

## 🏢 How Multi-Tenancy Works

```
New Business Owner:
  → Activate Account → Register Company tab
  → Enters Company Name + Admin details
  → Receives unique Company ID (e.g., 3)
  → All future data tagged with company_id = 3

New Employee:
  → Activate Account → Activate Employee tab
  → Enters Company ID (3) + Employee ID + sets password
  → Login issues JWT: { employee_id, role, company_id: 3 }
  → Every API call is filtered: WHERE company_id = 3

Result:
  Company A and Company B share the same tables
  but NEVER see each other's employees, customers,
  products, or challans. ✅
```

---

## 🚀 Setup & Running Locally

### Option A: Run via Docker Compose (Recommended)
Bootstraps the PostgreSQL database, Backend server, and Frontend app automatically:

1. Clone the repository and navigate to the project root.
2. Build and run the containers:
   ```bash
   docker-compose up --build
   ```
3. Open `http://localhost:5173` to access the application.

---

### Option B: Run Manually

#### 1. Database Setup
1. Create a PostgreSQL database named `erp_crm_db`.
2. Import the schema by running the SQL queries in [backend/schema.sql](backend/schema.sql).

#### 2. Running the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5001
   DATABASE_URL=postgresql://user:password@localhost:5432/erp_crm_db
   JWT_SECRET=your_jwt_secret
   ```
3. Install dependencies and start the server:
   ```bash
   npm install
   npm run build
   npm start
   ```

#### 3. Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5001
   ```
3. Install dependencies and run in development mode:
   ```bash
   npm install
   npm run dev
   ```
4. Access the portal at `http://localhost:5173`.

---

## 🔑 Getting Started (First Use)

1. Open the live portal or run locally.
2. Click **Activate Account** in the header.
3. Switch to the **Register Company** tab.
4. Enter your **Company Name** and set up your Admin profile.
5. Note the **Company ID** returned — share this with your employees.
6. Your employees visit **Activate Account → Activate Employee**, enter the Company ID, and set their passwords.
7. Everyone logs in with their Employee ID + Password + Company ID.
