# Vehicle Form & Code Flow Specification

This document details the user registration/edit workflow and the technical code execution path for the **Vehicle Form** in the fleet management panel.

---

## 1. User/Business Process Workflow

The diagram below outlines the logical workflow a user goes through when interacting with the Vehicle Form:

```mermaid
graph TD
    A[Start: Navigate to Vehicle Form] --> B{Form Mode?}
    B -->|Create| C[Render Empty Form]
    B -->|Edit| D[Fetch Existing Vehicle Details]
    D --> E[Populate Fields & Documents State]
    C --> F[User Fills Out Fields]
    E --> F
    F --> G[Click "Save Vehicle" Submit]
    G --> H{Form Valid?}
    H -->|No| I[Trigger onInvalid: Alert & Smooth Scroll to First Mandatory Error]
    I --> F
    H -->|Yes| J[Show Confirmation Dialog]
    J -->|Cancel| F
    J -->|Confirm| K[Assemble FormData & Upload Files]
    K --> L[Send API Request to Backend]
    L --> M{API Success?}
    M -->|No| N[Show Error Toast Alert]
    M -->|Yes| O[Show Success Toast Alert & Redirect to /vehicles]
```

---

## 2. Technical Code Execution Flow (`VehicleFormPage.tsx`)

### Phase A: Component Initialization & Dropdown Hydration
1. **Component Mounted**: The `VehicleFormPage` component initializes.
2. **Retrieve Dropdowns & Masters**:
   - Executes `fetchInitialData()` inside `useEffect`.
   - Sends parallel HTTP GET requests using `tenantApi` to retrieve drop-down values for:
     - Vehicle Types (`/masters/forms/dropdowns/fields?type=vehicle&field=vehicle_type`)
     - Fuel Types (`/masters/forms/dropdowns/fields?type=vehicle&field=fuel_type`)
     - Permit Types (`/masters/forms/dropdowns/fields?type=vehicle&field=permit_type`)
     - Ownership Types (`/masters/forms/dropdowns/fields?type=vehicle&field=ownership_type`)
     - Common Statuses (`/masters/forms/dropdowns/fields?type=common&field=status`)
     - GPS Devices (`/gps-device/for/dropdown`)
   - Populates state arrays to render drop-downs dynamically.

### Phase B: Form Setup & Conditional Field Visibility
1. **React Hook Form Binding**: `useForm<FormInputs>` hook manages form state, error tracking, and input references.
2. **Pre-population (Edit Mode Only)**:
   - If `mode === "edit"` and `vehicleId` is present, it fetches vehicle data via GET `/vehicles/:id`.
   - Formats timestamp fields into standard date values (`YYYY-MM-DD`).
   - Calls `reset(data)` to populate fields.
3. **Dynamic Field Interdependencies**:
   - `useWatch({ control, name: "ownership_type" })` monitors the selected ownership type.
   - If ownership type is `"contract"`, vendor name and contact inputs are enabled; otherwise, they are disabled and styled as inactive.

### Phase C: Validation & Error Focus/Navigation
1. **Validation Scheme**: Inputs are registered with constraint configurations, e.g. `{ required: "Field is required" }`.
2. **Invalid Submission Handler (`onInvalid`)**:
   - When a user submits the form with missing or invalid fields, React Hook Form intercepts the event and runs `onInvalid(errors)`.
   - A global error toast is triggered: `"Please fill in all mandatory fields correctly."`.
   - The first key in the `errors` dictionary is extracted: `firstError = Object.keys(errors)[0]`.
   - Looks up the element in the DOM: `const el = document.querySelector(\`[name="\${firstError}"]\`)`.
   - Scrolls the viewport smoothly: `el.scrollIntoView({ behavior: "smooth", block: "center" })`.
   - Focuses the invalid input: `el.focus({ preventScroll: true })`.

### Phase D: Submission & File Handling
1. **Confirmation Prompt**: Before processing the payload, the code calls `confirm()` to prompt the user.
2. **Construct Payload (`FormData`)**:
   - Instantiates a standard `FormData` object to support file uploads.
   - Iterates through the text fields, appending non-empty strings to `FormData`.
   - Collects uploaded files (`FileList`) for documents such as RC Book, Permit copy, and Insurance certificate, and appends them to the payload.
3. **Network Call**:
   - **Create**: Sends POST to `/vehicles` with the multipart payload.
   - **Edit**: Sends PUT to `/vehicles/:id`.
4. **Completion**:
   - Shows success feedback.
   - Calls `navigate("/vehicles")` to redirect the user.

---

## 3. Backend API & Database Mapping Flow

When the frontend submits the request, the backend handles the database updates and file storage:

```
[ Frontend: FormData ]
       │
       ▼
[ POST/PUT /api/vehicles ]
       │
       ├─► Middleware: Multer parses multipart file fields (saves files to storage)
       │
       ├─► Controller: Maps form-data properties to SQL columns
       │
       └─► Database Transaction (Query/Mutation)
             │
             ├─► Insert/Update values in `vehicles` table
             └─► Commit changes & return JSON response: `{ success: true, data: VehicleRow }`
```
