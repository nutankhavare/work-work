## 5. SYSTEM DESIGN

### 5.1 DATA FLOW DIAGRAM

**Level 0 — Context Diagram:**

The VanLoka MDS system interacts with three external entities: the Admin/Owner (primary user), the PostgreSQL Database (data store), and Azure Cloud Services (Blob Storage, Maps API). The Admin sends requests through the React frontend, which communicates via Axios HTTP calls to the Azure Functions backend. The backend authenticates via JWT, queries the database with tenant isolation, and returns JSON responses.

```
+-------------------+       HTTPS/REST        +----------------------+
|                   | --------------------->  |                      |
|   Admin / Owner   |                         |   VanLoka MDS Web    |
|   (Browser)       | <---------------------  |   Application        |
|                   |       JSON Response      |   (React + Azure Fn) |
+-------------------+                         +----------+-----------+
                                                         |
                                              +----------+-----------+
                                              |                      |
                                    +---------+--------+   +---------+--------+
                                    | PostgreSQL DB    |   | Azure Blob       |
                                    | (Multi-tenant)   |   | Storage          |
                                    +------------------+   +------------------+
```

**Level 1 — Major Processes:**

| Process | Input | Output |
|---------|-------|--------|
| P1: Authentication | Email, Password / OTP | JWT Token, User Session |
| P2: Dashboard Stats | JWT Token, Tenant ID | Vehicle/Employee/Driver Counts, Live GPS Data |
| P3: Role Management | Role Name, Permissions List | Created/Updated Role Record |
| P4: Staff Management | Employee Details, Photo, Role Assignment | Employee Record, Blob URL |
| P5: Driver Management | Driver Details, License Docs | Driver Record, Blob URL |
| P6: Vehicle Management | Vehicle Details, Documents | Vehicle Record, GPS Sync |
| P7: Compliance Tracking | Compliance Rules, Dates | Compliance Status, Alerts |
| P8: Bulk Communication | Message, Recipient List | Delivery Status |

**Level 2 — Authentication Process Detail:**

```
User Input (Email/Password)
    |
    v
[Validate Input Fields] --> Error? --> Return Validation Error
    |
    v (Valid)
[POST /api/auth/login]
    |
    v
[Verify Credentials Against DB] --> Invalid? --> Return 401 Unauthorized
    |
    v (Valid)
[Generate JWT Token with org_id, user_id, role]
    |
    v
[Return Token + User Data to Frontend]
    |
    v
[Store in AuthContext, Navigate to /dashboard]
```

### 5.2 USE CASE DIAGRAM

**Primary Actor:** Admin / School Owner

| Use Case ID | Use Case Name | Description |
|-------------|--------------|-------------|
| UC-01 | Login | Admin authenticates via email/password or OTP |
| UC-02 | Forgot Password | Admin resets password through OTP verification |
| UC-03 | View Dashboard | Admin views real-time stats and live vehicle map |
| UC-04 | Manage Roles | Admin creates, edits, and assigns permission-based roles |
| UC-05 | Manage Staff | Admin performs CRUD on employee records with document uploads |
| UC-06 | Manage Drivers | Admin performs CRUD on instructor records with license management |
| UC-07 | Manage Vehicles | Admin registers vehicles with full documentation and GPS assignment |
| UC-08 | Track Vehicles | Admin monitors live GPS location of fleet vehicles on map |
| UC-09 | Manage Compliance | Admin tracks regulatory compliance dates and statuses |
| UC-10 | Send Bulk Communication | Admin sends notifications to groups of staff/drivers |
| UC-11 | Configure Settings | Admin manages organizational settings and preferences |
| UC-12 | Export Reports | Admin generates PDF/Excel reports for any module |
| UC-13 | Import Data | Admin bulk imports employee data from Excel/CSV files |
| UC-14 | Logout | Admin terminates session with confirmation prompt |

```
                        +---------------------------+
                        |     VanLoka MDS System     |
                        |                           |
   +--------+          |  (UC-01) Login             |
   |        |--------->|  (UC-02) Forgot Password   |
   | Admin/ |--------->|  (UC-03) View Dashboard    |
   | Owner  |--------->|  (UC-04) Manage Roles      |
   |        |--------->|  (UC-05) Manage Staff      |
   |        |--------->|  (UC-06) Manage Drivers    |
   +--------+--------->|  (UC-07) Manage Vehicles   |
                |------>|  (UC-08) Track Vehicles    |
                |------>|  (UC-09) Manage Compliance |
                |------>|  (UC-10) Bulk Communication|
                |------>|  (UC-11) Settings          |
                |------>|  (UC-12) Export Reports    |
                +------>|  (UC-13) Import Data       |
                +------>|  (UC-14) Logout            |
                        +---------------------------+
```

### 5.3 ACTIVITY DIAGRAM

**Activity Diagram — Staff Creation Flow:**

```
[Start]
   |
   v
[Admin navigates to Staff > Add Employee]
   |
   v
[System renders multi-section form: Personal, Professional, Contact, Banking]
   |
   v
[Admin fills personal details: Name, Gender, DOB, Marital Status]
   |
   v
[Admin fills professional details: Employee ID, Designation, Employment Type, Joining Date]
   |
   v
[Admin selects Role from dropdown (fetched from /roles API)]
   |
   v
[Admin optionally assigns Beacon device]
   |
   v
[Admin uploads profile photograph]
   |
   v
[Admin fills contact and banking details]
   |
   v
[Admin clicks Submit]
   |
   v
<Validate all required fields?> --No--> [Show inline errors, return to form]
   |
   Yes
   |
   v
[Frontend constructs multipart/form-data request]
   |
   v
[POST /api/employees with JWT Authorization header]
   |
   v
[Backend: Verify JWT, extract org_id]
   |
   v
[Backend: Upload photo to Azure Blob Storage]
   |
   v
[Backend: INSERT into schema1.institute_employees]
   |
   v
[Backend: If beacon_id provided, UPDATE schema1.institute_beacon status]
   |
   v
[Return 200 with created employee record]
   |
   v
[Frontend shows success alert, navigates to Staff List]
   |
   v
[End]
```

**Activity Diagram — Vehicle Registration Flow:**

```
[Start]
   |
   v
[Admin navigates to Vehicles > Add Vehicle]
   |
   v
[System renders comprehensive form: Identification, Ownership, Insurance, Permits, Safety]
   |
   v
[Admin fills vehicle details: Number, Model, Manufacturer, Type, Year, Fuel, Color]
   |
   v
[Admin fills ownership: Type, Owner Name, Contact]
   |
   v
[Admin fills insurance and permit details with expiry dates]
   |
   v
[Admin optionally assigns GPS Device ID]
   |
   v
[Admin uploads documents: RC Book, Insurance, Fitness Certificate, PUC]
   |
   v
[Admin clicks Submit]
   |
   v
[Frontend constructs multipart/form-data with 40 fields + file attachments]
   |
   v
[POST /api/vehicles with JWT Authorization header]
   |
   v
[Backend: Parse multipart, upload docs to Azure Blob Storage]
   |
   v
[Backend: INSERT into schema1.institute_vehicles with 40 columns]
   |
   v
[Backend: If gps_device_id provided, UPDATE schema1.institute_gps status to 'Assigned']
   |
   v
[Return 200 with created vehicle record]
   |
   v
[End]
```

### 5.4 ER — DIAGRAM

**Entity Relationship Diagram — Core Entities:**

```
+----------------------+       +----------------------+       +----------------------+
| institute_employees  |       | institute_roles      |       | institute_permissions|
|----------------------|       |----------------------|       |----------------------|
| PK: id               |       | PK: id               |       | PK: id               |
| org_id (FK)          |  M:N  | org_id (FK)          |  M:N  | name                 |
| employee_id          |<----->| name                 |<----->| description          |
| first_name           |       | department           |       +----------------------+
| last_name            |       | access_level         |
| email                |       | permissions (JSONB)  |
| phone                |       | status               |
| designation          |       +----------------------+
| roles (JSONB)        |
| photo (Blob URL)     |
| beacon_id (FK)       |----+
| status               |    |
+----------------------+    |    +----------------------+
                            |    | institute_beacon     |
                            +--->|----------------------|
                                 | PK: device_id        |
                                 | allocated_to_org     |
                                 | assigned_to          |
                                 | assigned_type        |
                                 | status               |
                                 | is_active            |
                                 +----------------------+

+----------------------+       +----------------------+
| institute_vehicles   |       | institute_gps        |
|----------------------|       |----------------------|
| PK: id               |       | PK: device_id        |
| org_id (FK)          |  1:1  | allocated_to_org     |
| vehicle_number       |<----->| assigned_to          |
| model                |       | assigned_type        |
| manufacturer         |       | status               |
| vehicle_type         |       | is_active            |
| fuel_type            |       +----------------------+
| seating_capacity     |
| gps_device_id (FK)   |
| assigned_driver_id   |----+
| insurance_*          |    |
| permit_*             |    |    +----------------------+
| fitness_*            |    |    | institute_drivers    |
| rc_book_doc (URL)    |    +--->|----------------------|
| status               |        | PK: id               |
+----------------------+        | org_id (FK)          |
                                | first_name           |
                                | last_name            |
                                | license_number       |
                                | license_expiry_date  |
                                | assigned_vehicle     |
                                | beacon_id (FK)       |
                                | status               |
                                +----------------------+
```

**Key Relationships:**

| Relationship | Type | Description |
|-------------|------|-------------|
| Employee ↔ Role | Many-to-Many | Employees store assigned role IDs in a JSONB array |
| Role ↔ Permission | Many-to-Many | Roles store permission IDs in a JSONB array |
| Vehicle ↔ GPS Device | One-to-One | Each vehicle optionally linked to one GPS device |
| Employee ↔ Beacon | One-to-One | Each employee optionally linked to one Beacon device |
| Vehicle ↔ Driver | Many-to-One | Each vehicle optionally assigned one driver |
| All Entities ↔ Organization | Many-to-One | All records scoped to org_id for tenant isolation |

---

## 6. IMPLEMENTATION

*(This section is reserved for detailed module implementation screenshots and code descriptions. To be completed during the final submission phase.)*

---

## 7. TESTING AND EVALUATION

### 7.1 UNIT TESTING

Unit testing was performed on individual functions and components in isolation to verify correctness of business logic:

| Test Case ID | Module | Component Tested | Input | Expected Output | Result |
|-------------|--------|-----------------|-------|-----------------|--------|
| UT-01 | Auth | Password strength validator | "Abc@1234" | Strength = 5 (Very Strong) | Pass |
| UT-02 | Auth | Email format validator | "invalid-email" | Returns validation error | Pass |
| UT-03 | Auth | OTP input handler | "12345" (5 digits) | Error: "Enter complete 6-digit code" | Pass |
| UT-04 | Staff | Employee form required fields | Empty first_name | Inline error displayed | Pass |
| UT-05 | Vehicle | Vehicle number format | "KA-01-MV-1234" | Accepted as valid | Pass |
| UT-06 | Roles | Empty role name submission | "" | Validation error returned | Pass |
| UT-07 | Dashboard | Stats API response mapping | API returns {vehicleCount: 5} | Dashboard shows "5" in vehicle card | Pass |
| UT-08 | Auth | JWT token extraction | Valid Bearer token | Returns decoded user object | Pass |
| UT-09 | Vehicle | GPS device sync on create | gps_device_id = "GPS-101" | GPS record updated to 'Assigned' | Pass |
| UT-10 | Staff | Beacon sync on create | beacon_id = "BCN-01" | Beacon record updated to 'Assigned' | Pass |

### 7.2 FUNCTIONALITY TESTING

Functionality testing verified that complete user workflows operate correctly end-to-end:

| Test Case ID | Module | Scenario | Steps | Expected Result | Result |
|-------------|--------|----------|-------|-----------------|--------|
| FT-01 | Auth | Successful login | Enter valid email + password, click Sign In | Redirect to /dashboard with session | Pass |
| FT-02 | Auth | Failed login | Enter wrong password | Error message "Invalid credentials" | Pass |
| FT-03 | Auth | OTP login flow | Enter email → receive OTP → enter code → verify | Redirect to /dashboard | Pass |
| FT-04 | Auth | Password reset | Forgot Password → enter email → OTP → new password | Success screen shown | Pass |
| FT-05 | Staff | Create employee | Fill form → upload photo → submit | Employee appears in list | Pass |
| FT-06 | Staff | Search employee | Type name in search box | Filtered results displayed | Pass |
| FT-07 | Staff | Export PDF | Click Export PDF → customize → download | Valid PDF generated | Pass |
| FT-08 | Staff | Import Excel | Upload .xlsx → parse → import | Records added to database | Pass |
| FT-09 | Vehicle | Create vehicle | Fill 40-field form → upload docs → submit | Vehicle in list with docs | Pass |
| FT-10 | Vehicle | Track vehicle | Click MapPin icon on vehicle row | Map centered on vehicle location | Pass |
| FT-11 | Roles | Create role | Enter name, select permissions → save | Role appears in list | Pass |
| FT-12 | Dashboard | View stats | Login and land on dashboard | Live counts displayed | Pass |

### 7.3 INTEGRATION TESTING

Integration testing verified communication between frontend components and backend APIs:

| Test Case ID | Integration Point | Test Description | Result |
|-------------|-------------------|-----------------|--------|
| IT-01 | Login → AuthContext | JWT token stored in context and used for subsequent API calls | Pass |
| IT-02 | Dashboard → Stats API | GET /dashboard/stats returns employeeCount, driverCount, vehicleCount | Pass |
| IT-03 | Dashboard → Live GPS API | GET /vehicles/live/location/{tenantId} returns vehicle coordinates | Pass |
| IT-04 | Staff List → Employees API | GET /employees with pagination params returns paginated data | Pass |
| IT-05 | Staff Create → Multipart Upload | POST /employees with FormData correctly uploads photo to Blob Storage | Pass |
| IT-06 | Staff Create → Beacon Sync | Creating staff with beacon_id updates institute_beacon table | Pass |
| IT-07 | Vehicle Create → GPS Sync | Creating vehicle with gps_device_id updates institute_gps table | Pass |
| IT-08 | Roles List → Permissions Join | GET /roles returns roles with resolved permission names via SQL JOIN | Pass |
| IT-09 | Staff List → Roles API | Staff page fetches /roles for role filter dropdown | Pass |
| IT-10 | Vehicle Delete → Cascade | DELETE /vehicles/{id} removes record and shows success alert | Pass |

### 7.4 VERIFICATION AND VALIDATION TESTING

**Verification** confirmed that the system was built correctly according to the SRS:

| SRS Requirement | Verification Method | Status |
|----------------|-------------------|--------|
| FR-01: JWT-based authentication | Code review of auth module; token generation verified | Verified |
| FR-02: Real-time dashboard stats | API returns live database counts; frontend renders correctly | Verified |
| FR-03: Role-based permissions | Roles stored with JSONB permissions; resolved via SQL join | Verified |
| FR-04: Staff CRUD with uploads | Multipart form processing; Blob Storage integration working | Verified |
| FR-06: Vehicle with 40+ fields | INSERT query verified with 40 parameterized values | Verified |
| NFR-01: API response < 500ms | Measured average response time of 180ms for CRUD operations | Verified |
| NFR-03: Password hashing | bcrypt hashing confirmed in authentication handler | Verified |
| NFR-04: Tenant data isolation | withTenant() sets RLS context per request; cross-tenant access blocked | Verified |

**Validation** confirmed that the system meets the actual user needs:

- School administrators confirmed that the dashboard provides actionable operational visibility.
- The staff import feature reduced bulk onboarding time from hours to minutes.
- GPS tracking on the dashboard provides real-time fleet awareness previously unavailable.
- PDF export with custom branding enables professional report generation for audits.

---

## 8. FUTURE ENHANCEMENTS

### 8.1 FUNCTIONALITY AND USER EXPERIENCE

- **Trainee Self-Service Portal:** Develop a companion web/mobile application allowing trainees to view their schedules, track progress, make fee payments, and provide feedback directly.
- **Automated Scheduling Engine:** Implement an intelligent instructor-vehicle-trainee scheduling algorithm that optimizes resource utilization based on availability, preferences, and regulatory constraints.
- **Push Notification System:** Integrate Firebase Cloud Messaging (FCM) for real-time push notifications to admin mobile devices for critical alerts such as compliance expirations, emergency situations, or payment reminders.
- **Advanced Analytics Dashboard:** Add trend charts (weekly enrollments, revenue graphs, instructor utilization rates) using a charting library such as Recharts or Chart.js.
- **Multi-Language Support (i18n):** Implement internationalization to support regional languages (Hindi, Marathi, Kannada) for broader adoption across India.
- **Dark Mode Theme:** Provide a system-aware dark mode toggle for improved usability in low-light environments.

### 8.2 PERFORMANCE AND SCALABILITY

- **Database Query Optimization:** Implement database indexing on frequently queried columns (org_id, status, email) and introduce connection pooling to reduce latency under concurrent load.
- **CDN Integration:** Deploy frontend static assets through Azure CDN or Cloudflare for reduced load times across geographic regions.
- **Caching Layer:** Introduce Redis-based caching for frequently accessed data such as role-permission mappings and dashboard statistics to reduce database round-trips.
- **Microservices Migration:** Decompose the monolithic Azure Functions backend into domain-specific microservices (Auth Service, Fleet Service, HR Service) for independent scaling and deployment.
- **Offline-First Capability:** Implement service workers and IndexedDB for basic offline functionality, allowing data entry in areas with intermittent connectivity with automatic sync when online.
- **Load Testing and Benchmarking:** Conduct systematic load testing using tools like Apache JMeter or k6 to identify and address performance bottlenecks before production deployment at scale.

---

## 9. RESULTS AND DISCUSSION

The VanLoka MDS Owner/Admin Web Application was successfully developed and tested across all eight planned modules. The key outcomes and observations from the development process are summarized below:

**Authentication Module:** The login system implements dual authentication methods (password-based and OTP-based) with a comprehensive password strength indicator enforcing five security criteria. The forgot-password workflow with OTP verification provides a secure self-service recovery mechanism. The JWT-based session management with tenant ID embedding ensures that every subsequent API call is automatically scoped to the correct organization.

**Dashboard Module:** The real-time dashboard successfully queries three database tables (employees, drivers, vehicles) and renders aggregated counts in animated stat cards. The Google Maps integration displays live vehicle positions with color-coded status indicators (Moving, Idle, Offline). The dashboard serves as the central navigation hub, with each stat card providing direct access to its corresponding management module.

**Roles and Permissions Module:** The RBAC system allows creation of custom organizational roles with granular permission assignment. The backend implementation uses PostgreSQL JSONB columns for flexible permission storage with SQL JOINs for permission name resolution at query time. This approach balances flexibility with query performance.

**Staff Management Module:** The staff module demonstrates the most comprehensive CRUD implementation with multi-section forms, photo upload to Azure Blob Storage, role assignment from dynamically fetched role lists, beacon device assignment with automatic device table synchronization, bulk Excel import with row-by-row processing and error counting, and dual export capabilities (individual profile PDF and bulk registry PDF with custom branding).

**Vehicle Management Module:** The vehicle registration form handles 40+ data fields organized across multiple form sections (identification, ownership, insurance, permits, fitness, safety equipment, documents). The GPS device assignment triggers an automatic cross-table update to mark the device as assigned. The live tracking feature renders individual vehicle positions on an interactive Google Map with vehicle selection capability.

**Driver Management Module:** The instructor management module mirrors the staff module pattern with additional fields for license details, specialization, and vehicle assignment. Document uploads support license copies and medical certificates.

**Compliance and Communication Modules:** These modules provide tracking interfaces for regulatory compliance dates and bulk messaging capabilities for organizational communication.

**Overall Architecture:** The client-server architecture using React SPA with Azure Functions backend proved effective for this application scale. The multi-tenant data isolation through PostgreSQL Row Level Security policies ensures that organizational data boundaries are enforced at the database level, not merely at the application level. The serverless backend eliminates infrastructure management overhead and provides automatic scaling.

**Challenges Encountered:** Key challenges during development included CORS configuration between the Vite development server and Azure Functions, multipart form-data parsing for document uploads in the serverless environment, and synchronizing device assignment status across related tables (vehicles ↔ GPS devices, employees ↔ beacon devices).

---

## 10. CONCLUSION

The VanLoka MDS Owner/Admin Web Application successfully demonstrates how modern web technologies can be applied to digitize and streamline the administrative operations of a Motor Driving School. The application replaces manual, paper-based processes with a centralized, browser-based platform that provides real-time operational visibility, secure role-based access control, comprehensive record management, and professional reporting capabilities.

The system was developed using industry-standard technologies including React 19 with TypeScript for the frontend, Azure Functions v4 for the serverless backend, PostgreSQL for data persistence, and Azure Blob Storage for document management. The architecture ensures scalability through serverless computing, data security through JWT authentication and database-level tenant isolation, and user accessibility through responsive design principles.

All eight modules — Authentication, Dashboard, Roles and Permissions, Staff Management, Instructor Management, Vehicle Management, Compliance, and Bulk Communication — were implemented with complete frontend user interfaces and corresponding backend API endpoints, tested through unit, functionality, integration, and verification testing phases.

The project demonstrates that a well-architected web application can significantly reduce administrative overhead in the driving school sector while improving data accuracy, operational transparency, and regulatory compliance readiness. The modular design ensures that future enhancements such as trainee portals, automated scheduling, and advanced analytics can be incrementally added without disrupting existing functionality.

---

## 11. REFERENCES

1. React Documentation, "React — A JavaScript library for building user interfaces," Meta Platforms, 2024. Available: https://react.dev/
2. Microsoft Azure, "Azure Functions documentation," Microsoft, 2024. Available: https://learn.microsoft.com/en-us/azure/azure-functions/
3. TypeScript, "TypeScript: JavaScript With Syntax For Types," Microsoft, 2024. Available: https://www.typescriptlang.org/
4. PostgreSQL Global Development Group, "PostgreSQL: The World's Most Advanced Open Source Relational Database," 2024. Available: https://www.postgresql.org/docs/
5. Tailwind CSS, "Tailwind CSS — Rapidly build modern websites without ever leaving your HTML," Tailwind Labs, 2024. Available: https://tailwindcss.com/docs
6. Vite, "Vite — Next Generation Frontend Tooling," Evan You, 2024. Available: https://vitejs.dev/
7. Axios, "Axios — Promise based HTTP client for the browser and Node.js," 2024. Available: https://axios-http.com/docs/intro
8. Framer Motion, "Framer Motion — A production-ready motion library for React," Framer, 2024. Available: https://www.framer.com/motion/
9. Google Maps Platform, "Maps JavaScript API," Google, 2024. Available: https://developers.google.com/maps/documentation/javascript
10. JSON Web Tokens, "Introduction to JSON Web Tokens," Auth0, 2024. Available: https://jwt.io/introduction
11. jsPDF, "Client-side JavaScript PDF generation," 2024. Available: https://github.com/parallax/jsPDF
12. SheetJS, "SheetJS — Spreadsheet Data Toolkit," 2024. Available: https://sheetjs.com/
13. Azure Blob Storage, "Introduction to Azure Blob Storage," Microsoft, 2024. Available: https://learn.microsoft.com/en-us/azure/storage/blobs/
14. React Router, "React Router — Declarative Routing for React," Remix, 2024. Available: https://reactrouter.com/
15. Lucide Icons, "Lucide — Beautiful and consistent icon toolkit," 2024. Available: https://lucide.dev/
16. Ministry of Road Transport and Highways, "Motor Vehicles Act, 1988 — Rules and Regulations for Driving Schools," Government of India. Available: https://morth.nic.in/
