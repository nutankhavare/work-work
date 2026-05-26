# VanLoka MDS Owner/Admin Web Application — Project Report

---

## 1. INTRODUCTION

The Motor Driving School (MDS) sector remains one of the most operationally intensive segments within the transportation training industry. A significant number of driving schools across India continue to rely on manual registers, handwritten ledgers, and fragmented paperwork to manage critical operations such as trainee enrolment, instructor scheduling, vehicle assignment, fee collection, and regulatory compliance documentation. This dependence on conventional record-keeping practices introduces systemic inefficiencies including inaccurate data entry, lack of operational transparency, potential revenue leakage through untracked fee payments, and considerable difficulty during governmental audits and inspections.

The VanLoka MDS Owner/Admin Web Application addresses these operational challenges through a purpose-built, browser-based administrative platform designed to digitize and centralize the complete spectrum of driving school management operations. The application provides school owners and designated administrators with a unified, real-time dashboard interface for managing trainees, instructors, vehicles, training sessions, organizational staff, feedback and complaint handling, bulk communication channels, regulatory compliance tracking, analytical reporting, and institutional configuration settings.

The system architecture follows a modern client-server paradigm utilizing a React-based Single Page Application (SPA) on the frontend communicating with a serverless Azure Functions backend. This architectural choice ensures horizontal scalability, multi-tenant data isolation, and minimal infrastructure management overhead. The application implements Role-Based Access Control (RBAC) to ensure that different organizational stakeholders — from school owners to administrative staff — access only the functionality and data pertinent to their designated responsibilities.

The core modules developed as part of this project encompass Authentication, Owner/Admin Dashboard, Roles and Permissions, Staff Management, Instructor (Driver) Management, Vehicle Management, Device Management, and Fees Management. Each module has been engineered with both frontend user interfaces and corresponding backend API endpoints, ensuring complete end-to-end operational capability.

This report presents the systematic design, development, and evaluation of the VanLoka MDS application, covering the literature review of existing solutions, system requirements specification, software design methodologies, implementation details of individual modules, testing strategies, and future enhancement possibilities.

---

## 2. LITERATURE REVIEW

### 2.1 EXISTING SYSTEM

The existing operational framework employed by the majority of Motor Driving Schools relies predominantly on manual, paper-based processes. The current system exhibits several fundamental limitations that impede efficient school administration:

**Manual Record Keeping:** Trainee registration forms, attendance records, instructor schedules, and vehicle maintenance logs are maintained in physical registers. This approach makes data retrieval time-consuming, increases the probability of transcription errors, and renders historical trend analysis practically infeasible.

**Fragmented Fee Collection:** Fee receipts are issued manually, often without centralized tracking. This creates opportunities for discrepancies between collected fees and recorded amounts, making financial auditing difficult and potentially enabling revenue leakage.

**Absence of Real-Time Monitoring:** School administrators lack visibility into ongoing operations such as active training sessions, vehicle locations, instructor availability, and device status. Decision-making is therefore reactive rather than proactive.

**Compliance Management Difficulties:** Regulatory documents such as vehicle fitness certificates, pollution under control certificates, insurance policies, and driving permits have expiration dates that must be tracked. Manual tracking of these dates across a fleet of vehicles frequently results in lapses that attract penalties during inspections.

**Communication Bottlenecks:** Communicating schedule changes, fee reminders, or administrative notices to groups of trainees or instructors requires individual phone calls or physical notice boards, resulting in delayed or missed communications.

**Limited Scalability:** Paper-based systems become increasingly unwieldy as the school grows. Adding more vehicles, instructors, or trainees proportionally increases the administrative burden without any efficiency gains.

### 2.2 PROPOSED SYSTEM

The VanLoka MDS Owner/Admin Web Application proposes a comprehensive digital transformation of driving school operations through the following architectural and functional improvements:

**Centralized Digital Platform:** All operational data — from trainee records to vehicle documentation — is stored in a centralized PostgreSQL database with multi-tenant isolation. This eliminates data silos and ensures a single source of truth for all administrative decisions.

**Role-Based Access Control (RBAC):** The system implements granular permission management, allowing school owners to define custom roles (e.g., Branch Manager, Accounts Officer, Fleet Supervisor) with specific access levels. This ensures data security while enabling delegation of administrative responsibilities.

**Real-Time Dashboard Analytics:** The owner/admin dashboard presents live statistical summaries including active vehicle count, total employees, registered instructors, and device status. Interactive stat cards provide instant navigation to detailed module views.

**Automated Document Management:** Vehicle and staff documents (RC books, insurance certificates, fitness certificates, PUC documents, staff photographs) are uploaded to Azure Blob Storage with automatic URL generation, eliminating physical document storage requirements.

**GPS and Beacon Integration:** The system integrates GPS device tracking for vehicles and Beacon device tracking for personnel, enabling real-time location monitoring through an embedded Google Maps interface on the dashboard.

**Export and Reporting Capabilities:** Each management module supports PDF and Excel export functionality with customizable branding (company logo, name, subtitle), enabling professional report generation for audits, internal reviews, and regulatory submissions.

**Responsive and Accessible Design:** The frontend utilizes responsive design principles ensuring usability across desktop workstations, tablets, and mobile devices, allowing administrators to manage operations from any location.

### 2.3 TOOLS AND TECHNOLOGIES USED

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Frontend Framework | React | 19.1.1 | Component-based UI development |
| Build Tool | Vite | 7.1.7 | Fast development server and production bundling |
| Language | TypeScript | 5.9.3 | Type-safe JavaScript superset |
| CSS Framework | Tailwind CSS | 4.1.14 | Utility-first responsive styling |
| Routing | React Router DOM | 7.9.4 | Client-side SPA navigation |
| HTTP Client | Axios | 1.12.2 | RESTful API communication |
| Animation | Framer Motion | 12.38.0 | UI micro-animations and transitions |
| Form Management | React Hook Form | 7.65.0 | Performant form validation |
| Maps | Google Maps API | 2.20.7 | Vehicle GPS tracking visualization |
| PDF Generation | jsPDF + AutoTable | 4.2.1 | Client-side PDF report generation |
| Excel Processing | SheetJS (xlsx) | 0.18.5 | Spreadsheet import/export |
| Icons | Lucide React | 0.477.0 | Consistent iconography |
| Backend Runtime | Azure Functions v4 | Node.js 18 | Serverless API endpoints |
| Database | PostgreSQL | 15+ | Relational data persistence |
| Cloud Storage | Azure Blob Storage | — | Document and image file storage |
| Authentication | JWT (JSON Web Tokens) | — | Stateless session management |
| Version Control | Git | — | Source code management |
| Package Manager | Bun / npm | — | Dependency management |
| Code Quality | ESLint + Prettier | 9.36 / 3.8.3 | Linting and code formatting |

---

## 3. SYSTEM REQUIREMENTS

### 3.1 HARDWARE REQUIREMENTS

| Component | Minimum Specification | Recommended Specification |
|-----------|----------------------|--------------------------|
| Processor | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 or higher |
| RAM | 4 GB | 8 GB or higher |
| Storage | 256 GB HDD | 512 GB SSD |
| Display | 1366 x 768 resolution | 1920 x 1080 resolution or higher |
| Network | Broadband connection (2 Mbps) | High-speed connection (10 Mbps+) |
| Input Devices | Standard keyboard and mouse | Standard keyboard and mouse |

**Server-Side (Azure Cloud):**

| Component | Specification |
|-----------|--------------|
| Compute | Azure Functions Consumption Plan (auto-scaling) |
| Database | Azure Database for PostgreSQL Flexible Server |
| Storage | Azure Blob Storage (Standard tier, LRS redundancy) |
| Region | Central India / South India |

### 3.2 SOFTWARE REQUIREMENTS

**Development Environment:**

| Software | Version |
|----------|---------|
| Operating System | Windows 10/11, macOS, or Linux |
| Node.js Runtime | 18.x LTS or higher |
| Code Editor | Visual Studio Code (latest) |
| Browser | Google Chrome 120+ / Mozilla Firefox 120+ / Microsoft Edge 120+ |
| Azure Functions Core Tools | v4.x |
| Git | 2.40+ |

**Deployment Environment:**

| Software | Details |
|----------|---------|
| Cloud Platform | Microsoft Azure |
| Runtime | Azure Functions v4 (Node.js 18) |
| Database | PostgreSQL 15+ |
| CDN/Hosting | Azure Static Web Apps / Vercel |
| SSL/TLS | Mandatory HTTPS via Azure-managed certificates |

---

## 4. SOFTWARE REQUIREMENT SPECIFICATION

### 4.1 INTRODUCTION

The Software Requirement Specification (SRS) document defines the functional and non-functional requirements for the VanLoka MDS Owner/Admin Web Application. The system is designed to serve as the primary administrative interface for Motor Driving School owners and their authorized staff members. The application scope encompasses eight interconnected modules: Authentication, Dashboard, Roles and Permissions, Staff Management, Instructor Management, Vehicle Management, Device Management, and Fees Management. Each module operates within a multi-tenant architecture where organizational data is isolated through tenant-specific database schemas and JWT-based authentication tokens.

### 4.2 FUNCTIONAL REQUIREMENTS

**FR-01: Authentication Module**
- The system shall provide email and password-based login with real-time field validation.
- The system shall support OTP-based login as an alternative authentication method.
- The system shall implement a "Forgot Password" workflow with email-based OTP verification and password reset.
- The system shall enforce password strength rules: minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character.
- The system shall issue JWT access tokens upon successful authentication with configurable expiration.
- The system shall support "Remember this device" functionality for session persistence.
- The system shall provide a logout mechanism with confirmation dialog to prevent accidental session termination.

**FR-02: Owner/Admin Dashboard Module**
- The system shall display real-time statistical summaries (total vehicles, employees, instructors, devices) on the dashboard.
- The system shall render an interactive Google Maps view showing live GPS positions of tracked vehicles.
- The system shall provide navigable stat cards that redirect to respective management modules.
- The system shall display fleet status indicators (Moving, Idle, Offline) on the map legend.
- The system shall support vehicle selection on the map with information overlay display.

**FR-03: Roles and Permissions Module**
- The system shall allow creation of custom roles with name, department, access level, and description.
- The system shall support assignment of granular permissions to each role from a master permissions list.
- The system shall display all roles in a searchable, paginated list with permission counts.
- The system shall support editing and deactivation of existing roles.
- The system shall prevent deletion of roles currently assigned to active staff members.

**FR-04: Staff Management Module**
- The system shall support CRUD operations for employee records including personal, professional, contact, and banking details.
- The system shall support staff photograph upload with Azure Blob Storage integration.
- The system shall support role assignment to staff members during creation and editing.
- The system shall support Beacon device assignment to individual staff members.
- The system shall provide search, filter (by role, status), and pagination for staff listings.
- The system shall support bulk import of employee data from Excel/CSV files.
- The system shall support individual and bulk PDF export with customizable branding.
- The system shall support staff deletion with confirmation dialog.

**FR-05: Instructor (Driver) Management Module**
- The system shall support CRUD operations for instructor records including license details, specialization, and experience.
- The system shall support document uploads (license copy, photo, medical certificate).
- The system shall provide dropdown data for vehicle assignment and beacon assignment.
- The system shall support search, filter, and pagination for instructor listings.
- The system shall support individual and bulk PDF export.

**FR-06: Vehicle Management Module**
- The system shall support comprehensive vehicle registration with 40+ data fields covering identification, ownership, insurance, permits, fitness, and safety equipment.
- The system shall support document uploads (RC book, insurance document, fitness certificate, PUC document).
- The system shall support GPS device assignment to vehicles with automatic sync to the GPS device table.
- The system shall support live vehicle tracking via Google Maps integration.
- The system shall provide search, filter (by type, status), and pagination for vehicle listings.
- The system shall support individual and bulk PDF/Excel export.

**FR-07: Device Management Module**
- The system shall support registration and tracking of GPS devices and Beacon devices.
- The system shall display device assignment status (assigned to vehicle/staff or unassigned).
- The system shall support filtering devices by type, status, and assignment.
- The system shall sync device assignment status when vehicles or staff are created/updated.

**FR-08: Fees Management Module**
- The system shall support fee structure definition with course-wise and category-wise pricing.
- The system shall track fee payments against trainee bookings with payment status indicators.
- The system shall support viewing booking details with associated fee information.

### 4.3 NON-FUNCTIONAL REQUIREMENTS

| ID | Requirement | Description |
|----|------------|-------------|
| NFR-01 | Performance | API response time shall not exceed 500ms for standard CRUD operations under normal load conditions. |
| NFR-02 | Scalability | The serverless architecture shall auto-scale to handle concurrent users without manual intervention. |
| NFR-03 | Security | All API endpoints shall require valid JWT authentication. Passwords shall be hashed using bcrypt. |
| NFR-04 | Data Isolation | Multi-tenant data shall be isolated using PostgreSQL Row Level Security (RLS) policies. |
| NFR-05 | Availability | The system shall target 99.9% uptime through Azure's managed service SLAs. |
| NFR-06 | Usability | The interface shall be responsive and functional on screens with minimum 360px width. |
| NFR-07 | Compatibility | The application shall support Chrome 120+, Firefox 120+, Edge 120+, and Safari 17+. |
| NFR-08 | Maintainability | The codebase shall follow TypeScript strict mode with ESLint and Prettier enforcement. |
| NFR-09 | Data Backup | Database backups shall be automated through Azure's managed backup service. |

### 4.4 INTERFACE REQUIREMENTS

#### 1. User Interface Requirements

- The application shall use a consistent design language across all modules with the Manrope font family.
- Primary accent color shall be purple (#7C3AED) with complementary slate-based neutral tones.
- All forms shall provide real-time validation with inline error messages displayed below respective fields.
- Tables shall support column-based sorting, search filtering, and pagination with configurable items per page.
- Modal dialogs shall use backdrop blur effects and smooth entry/exit animations via Framer Motion.
- Status indicators shall use color-coded badges: green for Active, amber for On Leave/Maintenance, red for Inactive.
- The sidebar navigation shall support collapsible state with icon-only mode for maximizing content area.
- The login interface shall implement a split-panel layout with branding panel on desktop and stacked layout on mobile.
- All delete operations shall require explicit user confirmation through a modal dialog.

#### 2. Hardware Interface Requirements

- The system shall interface with GPS tracking devices through backend API integration for real-time vehicle location data.
- The system shall interface with Bluetooth Beacon devices for staff proximity tracking and attendance.
- Document scanning hardware (if available) can be used to capture and upload physical documents through the browser's file input interface.
- The system shall communicate with Azure cloud infrastructure over HTTPS (TLS 1.2+) for all data transfer.

### 4.5 CONSTRAINTS

| Constraint | Description |
|-----------|-------------|
| Internet Dependency | The application requires an active internet connection for all operations as it communicates with cloud-hosted backend services. |
| Browser Limitation | The application is designed for modern browsers only and does not support Internet Explorer or browsers released before 2023. |
| Single Organization Scope | Each deployment instance serves a single driving school organization, with multi-branch support managed through the tenant configuration. |
| File Size Limits | Document uploads are limited to 10 MB per file to ensure reasonable upload times and storage costs. |
| Google Maps API Dependency | The live tracking feature requires a valid Google Maps API key with billing enabled, introducing an external service dependency. |
| Azure Platform Lock-in | The backend is built on Azure Functions and Azure Blob Storage, creating a dependency on the Microsoft Azure ecosystem. |

---
