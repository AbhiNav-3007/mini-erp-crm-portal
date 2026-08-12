# ERP + CRM Operations Portal

## 1. Project Overview
The **ERP + CRM Operations Portal** is a full-stack internal business management application designed for a small wholesale/distribution-oriented organization. The purpose of the system is to bring several day-to-day operational activities into one centralized platform instead of managing them through disconnected tools, spreadsheets, or manual processes.
The application combines essential CRM and ERP-style operational workflows such as customer management, follow-up tracking, product management, inventory monitoring, stock movements, sales challan management, and role-based access control.
The system is intentionally designed as a focused business application rather than a large enterprise ERP. The objective is to build a practical, maintainable and complete full-stack solution where every major business action has a clear relationship with the underlying API, database and user interface.

---

## 2. Business Problem & Purpose
In a small business environment, different teams often handle different parts of the same business process. When these activities are handled separately, customer information can become difficult to maintain consistently, sales follow-ups can be forgotten, product and inventory information may not be immediately available, stock changes may lack a clear history, and different employees may receive access to information they should not manage.
The portal connects these modules into a unified system:
- **CRM**: Customer profile management and follow-up activities.
- **Product Management**: Maintaining product details and stock status.
- **Inventory Management**: Monitoring stock levels and logging all stock changes.
- **Sales Operations**: Creating and confirming challans that are connected to inventory.
- **Connected Workflow**: Sales creates a challan → checks availability → confirms challan → stock reduces automatically → Stock OUT is recorded → Accounts/Admin see updates.

---

## 3. Target Users & Responsibilities

### 3.1 Admin
Admin is the highest-level operational user and has broad access to the system.
- Manage employee access and create employee profiles.
- View and manage customers, products, inventory, and stock movements.
- View and manage challans and access the overall operational dashboard.

### 3.2 Sales
Sales users are primarily responsible for customer-facing operational activities.
- Manage and search customer profiles.
- Add customer follow-up notes.
- Create draft and confirmed challans, viewing product availability in real-time.

### 3.3 Warehouse
Warehouse users are responsible for product and inventory operations.
- View and manage products, current stock, and stock movements.
- Monitor low-stock products and record controlled Stock IN operations.
- Normal Stock OUT is generated automatically from confirmed sales challans.

### 3.4 Accounts
Accounts users require access to relevant customer, challan and transaction information.
- View customers, challans, and transaction history.
- Perform approved review and editing operations. Edits on Sales data must preserve history for Admin tracking.

---

## 4. Employee Registration and Login
* **Employee Identities**: Admin pre-creates employee records containing Employee ID, name, role, and joining date.
* **ID Validation**: Employee IDs follow prefix conventions matching the employee's role (e.g. Sales prefix must match Sales role selection during activation).
* **Activation Workflow**:
  1. User navigates to register and selects role.
  2. Enters Employee ID, name, joining date, and password.
  3. Backend verifies inputs match Admin's pre-created record and validates ID prefix.
  4. Account is activated.
* **Login Workflow**: Activated user selects profile, enters ID and password → backend verifies credentials → issues JWT token → redirects to role-based dashboard.
* **Access Model**: Frontend displays dynamic layouts per role; backend enforces JWT authorization and RBAC permissions on all API endpoints.

---

## 5. Core Functionalities & Workflow Rules
* **Customer & Follow-Up**: Manage customer records. Sales users can log follow-up notes identifying customer, note content, employee, and timestamp.
* **Products & Inventory**: Manage products (unique SKU). Warehouse monitors stock levels, tracks low stock, and records controlled Stock IN.
* **Stock Movements**: Logs every change: product, type (IN/OUT), quantity, reason/source, related challan, employee, and timestamp.
* **Sales Challans**: Connects customers, products, and inventory.
  * **Draft Workflow**: Select Customer → Add Products → Enter Quantities → Check Availability → Save Draft (does not affect stock).
  * **Confirmation Workflow**: Verify challan → Check available stock:
    ```text
    [Stock Available?] ──(No)──> Reject
          │ (Yes)
          ▼
    Update Stock (reduce) ──> Create Stock OUT Movement ──> Confirm Challan
    ```

---

## 6. Main User Workflows
* **Admin Workflow**:
  `Login ➔ Admin Dashboard ➔ Employee Access (Create/View) ➔ Customers ➔ Products ➔ Inventory ➔ Stock Movements ➔ Challans`
* **Sales Workflow**:
  `Login ➔ Sales Dashboard ➔ Customers (Search/View/Add/Edit/Follow-up) ➔ Create Challan ➔ Confirm ➔ Stock OUT`
* **Warehouse Workflow**:
  `Login ➔ Warehouse Dashboard ➔ Products ➔ Inventory (Stock Levels, Stock IN) ➔ Stock Movements`
* **Accounts Workflow**:
  `Login ➔ Accounts Dashboard ➔ Customers ➔ Challans ➔ Transactions View ➔ Approved Adjustments`

---

## 7. UI / UX Structure

### 7.1 Landing Page
The landing page introduces the portal and provides the application identity, a short description of the workflows, and option buttons for user login and user registration/account activation.

### 7.2 Login Page
Contains role profile selection buttons (Admin, Sales, Warehouse, Accounts), text input fields for Employee ID and Password, and a submit button. Any mismatched profile selection yields a clear validation error.

### 7.3 Registration & Activation Page
Form inputs for choosing a profile, Employee ID, Employee name, Date of joining, Role select, Password, and Password confirmation. Inputs are validated authoritatively on the backend.

### 7.4 Dashboard Layout
Once logged in, the employee sees a standard layout structure consisting of a header (identifying the active user profile, name, and logout button) and a sidebar navigation panel which dynamically adapts to display pages permitted for the active role.

### 7.5 Role-Based Dashboard Panels
- **Admin Dashboard**: Contains summary cards for overall operations, employee profile status cards, customer management screens, product databases, stock levels, stock movement logs, and sales challans.
- **Sales Dashboard**: Displays a directory of customers, follow-up editor widgets, and a sales challan creator form supporting draft saving and real-time inventory checks.
- **Warehouse Dashboard**: Focuses on product catalog viewing, inventory stock adjustments (including a Stock IN transaction portal), and movement tracking history.
- **Accounts Dashboard**: Contains lists of customers, completed challans, transaction records, and approved review/editing panels.

---

## 8. Data and Database Structure
The application uses a relational MySQL database because the business data has clear relationships.
* **Main Entities**: Employees, Customers, Follow-up Notes, Products, Stock Movements, Challans, and Challan Items.
* **Relationship Workflow**:
  ```text
  Employee ➔ Operational Records
  Customer ➔ Many Challans ➔ Many Challan Items ➔ Products ➔ Stock Movements
  ```
* **Keys & Constraints**: Primary keys identify individual records, while foreign keys maintain relationships between related tables.

---

## 9. REST API Layer & Communication Flow
The frontend communicates with the backend through REST APIs.
* **APIs Handled**: Authentication, employee activation, customers, follow-ups, products, inventory, stock movements, and challans.
* **Communication Model**:
  ```text
  React Frontend ➔ HTTP Request ➔ REST API ➔ Express Backend ➔ Business Services ➔ MySQL DB
  ```
* **Security Guard**: The API layer ensures that the frontend does not directly access the database.

---

## 10. Layered Application Structure

### 10.1 Backend Layered Architecture
The backend application follows a clean layered structure to separate concerns:
- **Routes Layer**: Defines all API endpoint paths, HTTP verbs (GET, POST, PUT, DELETE), and links them to the correct controllers and middleware chains.
- **Middleware Layer**: Intercepts requests to perform cross-cutting tasks such as JWT authentication validation, role-based permission checks (RBAC), body schema validation, and centralized error parsing.
- **Controllers Layer**: Extracts incoming request parameters, validates formats, delegates the core business tasks to services, and returns standardized JSON responses with correct HTTP statuses.
- **Services Layer**: Executes all core business logic (e.g. validating employee activation credentials, checking stock level constraints during challan confirmations, and executing calculations).
- **Database Layer**: Orchestrates connection pooling, manages raw SQL queries, performs reading and writing operations, and handles multi-query database transactions.

### 10.2 Frontend Layered Architecture
The client application is organized into a clean folder layout:
- **Routing Engine**: Protects frontend views by verifying auth status and role permissions before allowing access to dashboard screens.
- **State & Context Layer**: Manages persistent authentication states, user profiles, and application tokens.
- **UI Components**: Holds generic elements like custom sidebars, navigation bars, cards, loading indicators, and form alerts.
- **Pages**: Role-specific dashboard layouts and screen content.
- **API Services**: Wraps backend REST API calls in reusable async fetch components.

---

## 11. Error and Validation Handling
The application implements standardized error codes and user-friendly error messages:
- **Authentication Errors**: Handles invalid Employee IDs, password mismatches, unregistered credentials, expired JWT tokens, and missing authorization headers.
- **Activation Errors**: Rejects activation requests if user details (name, joining date, or role) do not match Admin's pre-created profile database, or if the ID prefix does not match the chosen role.
- **Validation Errors**: Traps empty fields, invalid email or phone structures, duplicate product SKUs, and duplicate challan numbers.
- **Business Rule Errors**: Blocks challan confirmations when requested item quantities exceed available stock, or when attempting to edit a locked/confirmed challan.
- **System Failures**: Standardized envelopes for database query failures, connection timeouts, and general server exceptions.

---

## 12. Tech Stack
* **Frontend**: React, JavaScript, HTML, Vanilla CSS (responsive design).
* **Backend**: Node.js, TypeScript, Express.js (REST APIs, request validation, error middleware).
* **Database**: MySQL.
* **Ops/Dev**: Git, GitHub, Postman, Docker, Docker Compose, AWS.

---

## 13. Development Phases
The project will be developed in small practical stages. Each stage is implemented, tested and understood before moving to the next.

* **Phase 1 — Repository and Initial Project Setup**:
  * *Build*:
    - Create a clean GitHub repository and clone it to the local workspace.
    - Initialize the project structure by creating the `frontend/` and `backend/` directories.
  * *Understand*:
    - The benefits of dividing full-stack software development into controlled, sequential phases.
    - Standard project documentation practices.
  * *Test*:
    - Verify git access, local-to-remote remote tracking, and correct folder paths.
  * *After completion*:
    - Document the setup process and explain the rationale for dividing the development path.

* **Phase 2 — Frontend Foundation**:
  * *Build*:
    - Initialize the React frontend workspace using npm and Vite.
    - Configure the folder structure and set up main HTML and JS entry components.
  * *Understand*:
    - The React bootstrap flow, component virtual DOM render loops, and project layouts.
  * *Test*:
    - Launch the React local development server and access the page via browser localhost port.
  * *After completion*:
    - Document the React starter workspace configuration and list main entry components.

* **Phase 3 — Backend Foundation**:
  * *Build*:
    - Initialize the Node.js project using npm in the `backend/` directory.
    - Configure TypeScript, install Express.js, and implement a health check API route.
  * *Understand*:
    - Node.js runtime operations, HTTP port bindings, request-response lifecycles, and Express routing.
  * *Test*:
    - Launch the local backend server and trigger the health check endpoint using Postman.
  * *After completion*:
    - Document server file structures, imports, listening ports, and health check routes.

* **Phase 4 — Connect Frontend and Backend**:
  * *Build*:
    - Implement asynchronous backend API fetch calls within the React frontend components.
  * *Understand*:
    - Cross-Origin Resource Sharing (CORS) configurations and REST endpoint paths.
    - Handling loading, success, and error API query states in React.
  * *Test*:
    - Verify that the frontend correctly fetches and displays the backend server status.
    - Test failure response handling by triggering queries to non-existent API routes.
  * *After completion*:
    - Record the client-to-server connection data logs and error handling traces.

* **Phase 5 — MySQL Database Setup**:
  * *Build*:
    - Configure MySQL server and design the relational tables matching business models.
    - Create tables: `Employees`, `Customers`, `FollowUpNotes`, `Products`, `StockMovements`, `Challans`, `ChallanItems`.
  * *Understand*:
    - Relational database designs, keys (primary/foreign), constraints (uniqueness/nullability), and indexes.
  * *Test*:
    - Insert and query sample rows directly in MySQL, verifying foreign key constraints.
  * *After completion*:
    - Record schema DDL scripts, columns data types, and entity relationship paths.

* **Phase 6 — Connect Backend to MySQL**:
  * *Build*:
    - Install MySQL client library in backend and configure connection pool parameters.
    - Write a database query layer service within backend models.
  * *Understand*:
    - Database client drivers, connection pool management, and securing credentials.
  * *Test*:
    - Build a test route performing a simple DB query and return output to client.
  * *After completion*:
    - Record database configurations, environment credentials setup, and SQL query logs.

* **Phase 7 — Backend Validation and Error Handling**:
  * *Build*:
    - Build Joi/Zod validation schemas and add centralized Express error middleware.
  * *Understand*:
    - Express middleware chains, validation status codes, and centralized error envelopes.
  * *Test*:
    - Send request payloads with missing fields or invalid types and verify error codes.
  * *After completion*:
    - Document standardized validation error payloads and generic exception formats.

* **Phase 8 — Employee Management**:
  * *Build*:
    - Implement Admin APIs to pre-register employee profile information.
    - Write role prefix checks (e.g. Employee ID matches Sales role prefix).
  * *Understand*:
    - Role prefix naming conventions and securing employee profiles from unauthorized reads.
  * *Test*:
    - Verify ID uniqueness, correct prefix checking, invalid role mismatch errors, and employee lookup operations.
  * *After completion*:
    - Document Admin creation logic, ID prefix rules, and backend validation code structure.

* **Phase 9 — Registration / Account Activation**:
  * *Build*:
    - Build activation UI and backend API to register accounts using pre-created profiles.
  * *Understand*:
    - Account activation states and password security during registration workflows.
  * *Test*:
    - Activate valid profile successfully; reject wrong name, joining date, mismatched role, or pre-activated IDs.
  * *After completion*:
    - Record account activation flow and database update queries.

* **Phase 10 — Login and JWT Authentication**:
  * *Build*:
    - Implement login API, password bcrypt hashing, and authentication middleware.
  * *Understand*:
    - Hashing, token authorization, stateless sessions, and token extraction middleware.
  * *Test*:
    - Verify login with correct credentials, reject wrong password or ID, and verify protected API route access.
  * *After completion*:
    - Document login endpoint schema, token payload details, and authentication middleware logic.

* **Phase 11 — Role-Based Authorization**:
  * *Build*:
    - Create backend RBAC middleware and link roles to dynamic frontend nav layouts.
  * *Understand*:
    - Difference between authentication and authorization, and RBAC route protection.
  * *Test*:
    - Log in to all roles to verify route access constraints, and attempt cross-role unauthorized API requests to check blocks.
  * *After completion*:
    - Document authorization flow diagram and unauthorized access response messages.

* **Phase 12 — Customer Management Backend**:
  * *Build*:
    - Implement REST endpoints for customer management (create, view all, search, edit details, and individual profile fetch).
  * *Understand*:
    - Designing RESTful paths, query params for search filters, and updates on relational data.
  * *Test*:
    - Validate each customer endpoint via Postman, checking database updates for correct records and constraints.
  * *After completion*:
    - Document customer APIs listing paths, methods, query parameters, and JSON payloads.

* **Phase 13 — Customer Management Frontend**:
  * *Build*:
    - Create customer UI including lists, search fields, registration/edit forms, and detail profile views.
  * *Understand*:
    - Form handling, state binding, paginating lists, and linking UI triggers to backend API calls.
  * *Test*:
    - Perform client-side customer creations and edits, verifying changes directly in the database.
  * *After completion*:
    - Map frontend customer views, action handlers, and user feedback message patterns.

* **Phase 14 — Follow-Up Notes**:
  * *Build*:
    - Create Sales UI components and APIs to save customer follow-up notes, logging employee references and timestamp.
  * *Understand*:
    - Parent-child relationships, audit logs, and tracking employee activity per customer record.
  * *Test*:
    - Insert multiple follow-up notes, verifying customer-employee relationship references and chronological listing.
  * *After completion*:
    - Document follow-up schema, insert queries, and history page layouts.

* **Phase 15 — Product Management**:
  * *Build*:
    - Implement Product APIs and UI for authorized roles to create, view, search, and edit products (SKU, description, price, stock).
  * *Understand*:
    - Product catalog models, unique product identifiers (SKUs), and price representation.
  * *Test*:
    - Verify product management actions, SKU uniqueness constraints, and search filters.
  * *After completion*:
    - Document product database columns and UI-to-API integrations.

* **Phase 16 — Inventory and Stock IN**:
  * *Build*:
    - Create stock lists, low-stock warning banners, Stock IN API/UI, and stock movement logs.
  * *Understand*:
    - Inventory balance logic, controlled incoming transactions, and tracking inventory movement history.
  * *Test*:
    - Perform Stock IN, verify product stock increases, and check that a movement log record is correctly written.
  * *After completion*:
    - Document inventory database schema and stock movement logging functions.

* **Phase 17 — Challan Creation**:
  * *Build*:
    - Create multi-item Sales Challan draft UI and APIs (customer selector, product items, quantity input, availability indicators).
  * *Understand*:
    - Nested form arrays, draft challan records, and temporary reservation logic vs committed stock updates.
  * *Test*:
    - Save draft challans and verify that product stock remains unaffected.
  * *After completion*:
    - Document challan draft generation process and details of draft records.

* **Phase 18 — Challan Confirmation and Automatic Stock OUT**:
  * *Build*:
    - Implement confirmation logic (validate challan → verify stock → update stock → log Stock OUT movement → confirm challan).
  * *Understand*:
    - Database transaction execution, rollback actions on stock exhaustion, and logging automated Stock OUT movements.
  * *Test*:
    - Confirm drafts and verify database changes: check stock balance reductions and corresponding Stock OUT movements.
  * *After completion*:
    - Document database records before and after challan confirmation.

* **Phase 19 — Accounts Workflow and Edit Visibility**:
  * *Build*:
    - Implement Accounts review screens. Edits on Sales data must preserve and log original/changed fields for Admin auditing.
  * *Understand*:
    - Auditing frameworks, data overrides, and historical change logs.
  * *Test*:
    - Perform adjustments as Accounts and verify that original and new values are readable in Admin audit screens.
  * *After completion*:
    - Document change logging design and audit database schema.

* **Phase 20 — Role-Specific Dashboards and UI/UX**:
  * *Build*:
    - Complete role-specific dashboards with customized layouts, loaders, empty states, alert alerts, and responsive CSS.
  * *Understand*:
    - Responsive layout breakpoints, conditional navigation elements, and dashboard analytics summary data.
  * *Test*:
    - Log in to all four roles across desktop, tablet, and mobile screens to verify dashboard layout responsiveness.
  * *After completion*:
    - Document sidebar routes, dashboard metrics widgets, and screen layouts.

* **Phase 21 — Full System Integration**:
  * *Build*:
    - Polish application workflows and link all modules into seamless end-to-end paths.
  * *Understand*:
    - Integration testing, transaction rollbacks, and verification of complex multivariable user paths.
  * *Test*:
    - Run full path: Admin creates employee → activation → login → Sales creates customer/challan → confirm → auto Stock OUT → Warehouse/Accounts see updates.
  * *After completion*:
    - Document end-to-end integration scenario results.

* **Phase 22 — Docker**:
  * *Build*:
    - Containerize frontend, backend, and MySQL database; write Dockerfiles and `docker-compose.yml` configuration.
  * *Understand*:
    - Images, containers, networks, volume mounts, environment overrides, and orchestration using docker-compose.
  * *Test*:
    - Build and run container stack using compose and verify same core application workflows.
  * *After completion*:
    - Document Dockerfiles, compose structure, and container network layout.

* **Phase 23 — AWS Deployment**:
  * *Build*:
    - Deploy app on AWS (EC2/RDS/S3 or similar simple architecture), configure CORS, prod env, and HTTPS.
  * *Understand*:
    - Cloud network structures, RDS configurations, static file hosting, and SSL certificates setup.
  * *Test*:
    - Verify production endpoints, cross-origin request functionality, and secure database connectivity.
  * *After completion*:
    - Document public URLs and AWS cloud architecture.

* **Phase 24 — Multi-Tenant SaaS Conversion**:
  * *Build*:
    - Upgrade the database schema with a `Companies` table and add `company_id` column to all tables.
    - Implement company registration (`/register-company`) and scoped login/activation routes.
    - Filter all backend queries by `company_id` derived from the user's JWT.
    - Update frontend with company sign-up forms and scoped auth credentials.
  * *Understand*:
    - Database partitioning, SaaS multi-tenancy, JWT-based tenant extraction, data isolation, and schema migrations.
  * *Test*:
    - Verify Company A and Company B have completely isolated data (e.g. employee IDs and products do not collide).
  * *After completion*:
    - Document company registration flow, API changes, and multi-tenant schema diagrams.

* **Phase 25 — Final QA and Project Presentation**:
  * *Build*:
    - Write final README, build Postman collections, prepare test credentials, clean repository.
  * *Test*:
    - Perform complete regression tests of the final integrated application.
  * *After completion*:
    - Document landing page, login, 4 dashboards, challan workflow, Postman collections, and deployed cloud instance.

---

## 14. Final Project Goal
Deliver a focused, production-style operations portal demonstrating how real business workflows (Business Requirement → User Role → UI/UX → React → API → Logic → DB → Result) translate to code. Judged on workflow coherence, clean architecture, relational integrity, role security, validation, and professional UI.

---

## 15. Future Possible Implementations
* **Analytics**: Advanced sales analytics, dashboard charts, trend analysis, and PDF reports.
* **Automation**: Low-stock notifications (email/SMS), purchase order pipelines.
* **Security & Perf**: Advanced auditing, granular permissions, caching (Redis), and background tasks.
