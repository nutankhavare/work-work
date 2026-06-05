# Backend API Inventory & Frontend Coverage

Generated dynamically by scanning `server.ts` and `frontend/src/`.

## Discovered Routes (46)

| Method | Route Path | Category | Auth | RLS Context | Used in Frontend? |
|---|---|---|---|---|---|
| GET | `/health` | Unknown | Public | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| POST | `/api/auth/login` | Auth | Public | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/auth/refresh` | Auth | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/employees` | Employee (Staff) | Bearer Token | None | ✅ Yes |
| GET | `/api/employees/:id` | Employee (Staff) | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| POST | `/api/employees` | Employee (Staff) | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| PUT | `/api/employees/:id` | Employee (Staff) | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| DELETE | `/api/employees/:id` | Employee (Staff) | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/vehicles` | Vehicle | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/dashboard/stats` | Reporting | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/vehicles/live/location/:tenantId` | Vehicle | Bearer Token | None | ❌ No |
| GET | `/api/vehicles/:id` | Vehicle | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| POST | `/api/vehicles` | Vehicle | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| PUT | `/api/vehicles/:id` | Vehicle | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| DELETE | `/api/vehicles/:id` | Vehicle | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/drivers` | Driver | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/drivers/:id` | Driver | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| POST | `/api/drivers` | Driver | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| PUT | `/api/drivers/:id` | Driver | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/devices` | Device Management | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| POST | `/api/devices/assign` | Device Management | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| POST | `/api/devices/unassign` | Device Management | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/gps-device/for/dropdown` | Device Management | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/beacon-device/for/dropdown` | Device Management | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/active-vehicles/for/dropdown` | Unknown | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| DELETE | `/api/drivers/:id` | Driver | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/roles` | Roles & Permissions | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| POST | `/api/roles` | Roles & Permissions | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/roles/:id` | Roles & Permissions | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| PUT | `/api/roles/:id` | Roles & Permissions | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| DELETE | `/api/roles/:id` | Roles & Permissions | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/permissions` | Roles & Permissions | Bearer Token | None | ✅ Yes |
| GET | `/api/masters/forms/dropdowns/fields` | Unknown | Public | None | ❌ No |
| GET | `/api/masters/forms/dropdowns/states` | Unknown | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/masters/forms/dropdowns/districts/:state` | Unknown | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/stats/summary` | Reporting | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/compliance` | Compliance | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/compliance/:id` | Compliance | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| POST | `/api/compliance` | Compliance | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| PUT | `/api/compliance/:id` | Compliance | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| DELETE | `/api/compliance/:id` | Compliance | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ❌ No |
| GET | `/api/organization/me` | Settings | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| PUT | `/api/organization/me` | Settings | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/broadcasts/stats` | Broadcasting | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| GET | `/api/broadcasts` | Broadcasting | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |
| POST | `/api/broadcasts` | Broadcasting | Bearer Token | Tenant-scoped via withTransaction/app.current_org_id | ✅ Yes |

## Frontend API Calls without Backend Routes

None. All frontend API calls map to valid registered backend endpoints.
