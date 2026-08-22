# ASTRA — Aadhaar Statistical Trends & Resource Analytics
## Product Requirements Document (PRD)

**Document Type:** Internal Government Analytics Platform PRD
**Status:** Draft v1.0
**Classification:** Internal Use — Authorized Government Personnel Only

> **Important framing note:** ASTRA is an internal, authorized-personnel-only analytics and forecasting platform. It is **not** a citizen-facing service, not a public Aadhaar portal, and not an official UIDAI system. All development, testing, and demonstration work assumes **anonymized, synthetic, or publicly available datasets**. ASTRA is architected from the ground up to never expose personally identifiable Aadhaar information (Aadhaar numbers, raw biometric templates, or any data that could re-identify an individual).

---

## Table of Contents

1. Problem Statement
2. Product Goals & Objectives
3. User Personas
4. Core Features
5. User Stories
6. Functional Requirements
7. Database Entities (MongoDB)
8. API Requirements
9. Authentication & Authorization
10. Data Processing & ML Pipeline
11. Edge Cases
12. Security & Privacy Requirements
13. Non-Functional Requirements
14. System Architecture
15. GitHub Actions & Testing
16. AWS Deployment
17. MVP Scope
18. Future Scope
19. User Flows
20. Success Metrics
21. Risks & Mitigation
22. Feature Prioritization (MoSCoW)
23. Final Product Summary

---

## 1. Problem Statement

Government departments responsible for Aadhaar-linked demographic, biometric, and resource-allocation programs face a set of recurring operational and analytical problems:

**Data fragmentation.** Demographic records, biometric enrollment/update logs, and resource-allocation records typically live in separate datasets, exports, or spreadsheets maintained by different departments or regional offices. There is no single place where an authorized officer can see all of this together.

**Difficulty managing large datasets.** Datasets at national or state scale can run into millions of rows. Without a proper ingestion, validation, and storage pipeline, departments fall back on manual spreadsheet handling, which is slow, error-prone, and doesn't scale.

**No centralized analytical visualization.** Officers today often rely on static reports (PDFs, Excel pivot tables) that go stale quickly and can't be filtered or explored interactively. There's no dashboard that lets someone drill from a national view down to a district view in a few clicks.

**Difficulty identifying demographic and biometric trends.** Questions like "which age groups are driving enrollment growth in this state?" or "is the update rate for a district abnormal?" require manual cross-referencing of multiple files today.

**Difficulty comparing regions and time periods.** Side-by-side comparison of two states, or of this quarter versus last year, is manual and time-consuming without a purpose-built tool.

**Challenges monitoring resource allocation.** Resource planning officials need to know where allocation has kept pace with demand and where it hasn't. Today this is discovered late, often only after a shortage becomes visible on the ground.

**No predictive insight.** Departments plan resource allocation reactively — based on last cycle's numbers — rather than proactively, because they lack tooling to forecast future demand from historical trends.

**Manual analysis is slow and error-prone.** Analysts spend disproportionate time on data wrangling (cleaning, merging, reformatting) rather than on the actual analysis, and manual calculations introduce risk of human error in numbers that inform real planning decisions.

**How ASTRA addresses this:** ASTRA centralizes dataset ingestion and storage, standardizes validation and preprocessing, and layers interactive analytics, cross-region comparison, and time-series forecasting on top — all behind role-based access control — so that government personnel can move from raw data to a planning decision in minutes rather than days, without ever touching personally identifiable Aadhaar information directly.

---

## 2. Product Goals & Objectives

- Provide a **single centralized system** for managing Aadhaar-related demographic, biometric, and resource-allocation datasets.
- Improve **government visibility** into current data state through a unified dashboard.
- Enable **faster demographic and biometric analysis** through pre-built, interactive analytics views.
- Support **interactive regional analysis and comparison** (state-to-state, district-to-district).
- Provide **resource allocation monitoring**, including allocation-vs-demand indicators.
- Provide **historical trend analysis** across configurable time windows.
- Provide **forecasting of future resource requirements** using historical time-series data.
- Help identify **unusual patterns or allocation gaps** that warrant officer attention.
- Support **evidence-based, data-driven resource planning** for government decision-makers.

**ASTRA is explicitly an internal government analytics and planning tool.** It is not a citizen-facing portal, has no public registration, and is never intended to interact directly with Aadhaar holders.

---

## 3. User Personas

### 3.1 Government Administrator

| Attribute | Details |
|---|---|
| Responsibilities | Manage user accounts and roles; manage dataset lifecycle at a system level; monitor system activity and audit logs; manage access permissions |
| Goals | Keep the platform secure, keep access tightly scoped, ensure system health |
| Pain points | No visibility today into who accessed what data; manual account provisioning; no centralized audit trail |
| ASTRA's value | Single admin console for users, roles, datasets, and audit logs |
| Permissions | Full system access: user/role management, all datasets, all analytics, audit logs, system configuration |

### 3.2 Government Data Analyst

| Attribute | Details |
|---|---|
| Responsibilities | Explore demographic and biometric data; build analyses; compare regions; identify trends/patterns |
| Goals | Quickly go from raw dataset to insight; avoid manual spreadsheet work |
| Pain points | Data scattered across sources; no interactive tooling; repetitive manual aggregation |
| ASTRA's value | Interactive filters, pre-built demographic/biometric analytics, exportable results |
| Permissions | Read access to datasets and analytics modules; can run analyses and exports; cannot manage users or system settings; dataset upload permission optional/configurable |

### 3.3 Resource Planning Officer

| Attribute | Details |
|---|---|
| Responsibilities | Monitor historical resource allocation; compare distribution across regions; review forecasts; plan future resource requirements |
| Goals | Anticipate demand before it becomes a shortage; justify allocation decisions with data |
| Pain points | Reactive planning based on stale numbers; no forecasting tooling; hard to compare regions |
| ASTRA's value | Resource allocation analytics, region comparison, forecast visualization with confidence indicators |
| Permissions | Read access to resource allocation and forecasting modules; can generate/view forecasts and export reports; no user/dataset administration |

### 3.4 Department Officer / Decision Maker

| Attribute | Details |
|---|---|
| Responsibilities | View summarized insights; review trends and forecasts; use analytical output to support planning decisions |
| Goals | Get a fast, trustworthy summary without needing to operate the tool deeply |
| Pain points | Reports today are static, infrequent, and hard to interpret at a glance |
| ASTRA's value | Dashboard-level summaries, KPI cards, forecast summaries, exportable reports |
| Permissions | Read-only access to dashboard, summarized analytics, and reports; no dataset or user management |

---

## 4. Core Features

### A. Government Dashboard
Overview of: total records, dataset statistics, demographic statistics, biometric statistics, resource allocation statistics, regional statistics, recent data updates, trend summaries, and forecast summaries. Gives any authorized user a fast read on system state without navigating deeper modules.

### B. Aadhaar Data Management
Dataset upload, import, validation, preprocessing, categorization, metadata, versioning, status tracking, data-quality indicators, search/filtering, and update history. Large datasets are handled via chunked/streamed upload, background/async processing jobs, and staged validation (structural → content → business-rule checks) so the UI never blocks on a large file.

### C. Demographic Analytics
Age distribution, gender distribution, regional distribution, population trends, state-level analysis, district-level analysis, demographic comparisons, and time-based trends.

### D. Biometric Analytics
Biometric enrollment trends, update trends, age-wise patterns, region-wise trends, time-based analysis, and unusual-pattern identification — always at an **aggregated, statistical level**. Raw biometric data (fingerprints, iris scans, templates) is never stored, displayed, or exposed by ASTRA; only aggregate counts and rates (e.g., "enrollments per district per month") are surfaced.

### E. Resource Allocation Analytics
Allocation by state, by district, by demographic category (where applicable), historical trends, regional comparisons, allocation distribution, demand indicators, under-/over-allocation flags, and utilization analysis where utilization data exists.

### F. Resource Allocation Forecasting
Time-series forecasting of future resource requirements, region-wise demand, and allocation trends. Includes historical-vs-predicted charts, region-wise predictions, prediction confidence/uncertainty bands where the model supports them, selectable forecast horizon, and model performance metrics (e.g., MAE, RMSE, MAPE).

### G. Interactive Data Visualization
KPI cards, line charts, bar charts, pie/donut charts, heatmaps, geographic maps (choropleth by state/district), area charts, time-series charts, and actual-vs-predicted overlay charts.

### H. Filtering & Data Exploration
Filter by state, district, date/time period, age group, gender, resource type, dataset, and other relevant attributes. All dashboard visualizations update dynamically/reactively based on active filters.

### I. Reports & Export
Export analytical results, export filtered datasets (where permission allows), generate reports, download forecast results, and export charts/summaries (CSV, PDF, PNG as appropriate).

---

## 5. User Stories

### Authentication
- As a **government employee**, I want to log in with my government-issued credentials, so that only authorized personnel can access the system.
- As a **logged-in user**, I want my session to expire after a period of inactivity, so that an unattended session doesn't remain open.
- As an **administrator**, I want to enforce role-based access, so that users only see the modules relevant to their role.

### Dataset Management
- As a **data analyst**, I want to upload a new dataset, so that its data becomes available for analysis.
- As a **data analyst**, I want the system to validate my dataset on upload, so that I know immediately if there are structural or content problems.
- As an **administrator**, I want to see the version history of a dataset, so that I can track how it has changed over time.
- As a **data analyst**, I want to search and filter existing datasets by category, region, or date, so that I can find the right dataset quickly.

### Data Exploration
- As a **data analyst**, I want to filter data by state, district, age group, and gender, so that I can narrow my analysis to a specific population.
- As a **department officer**, I want a dashboard summary, so that I can understand the current data state without digging into raw numbers.

### Demographic Analysis
- As a **data analyst**, I want to view age and gender distribution by region, so that I can identify demographic patterns.
- As a **data analyst**, I want to compare demographic trends between two states, so that I can identify regional differences.

### Biometric Analysis
- As a **data analyst**, I want to view aggregate biometric enrollment and update trends over time, so that I can spot unusual spikes or drops.
- As a **data analyst**, I want to see age-wise biometric update patterns, so that I can identify which age groups need more enrollment drives.

### Resource Allocation Analysis
- As a **resource planning officer**, I want to view historical resource allocation by state and district, so that I can identify where allocation has lagged demand.
- As a **resource planning officer**, I want to compare resource distribution across regions, so that I can identify inequities.
- As a **department officer**, I want to see under-allocation indicators, so that I can prioritize attention to at-risk regions.

### Forecasting
- As a **resource planning officer**, I want to generate a forecast of future resource demand for a region, so that I can plan proactively.
- As a **resource planning officer**, I want to see forecast confidence intervals, so that I understand the reliability of a prediction.
- As a **department officer**, I want to see a summary of forecasted vs. historical demand, so that I can quickly judge whether current plans are sufficient.

### Filtering
- As any **authorized user**, I want dashboard visualizations to update instantly when I change a filter, so that I can explore data interactively without reloading.

### Report Generation & Export
- As a **department officer**, I want to export a summary report as a PDF, so that I can share it in a briefing.
- As a **resource planning officer**, I want to download forecast results as CSV, so that I can incorporate them into planning spreadsheets.

### User Management
- As an **administrator**, I want to create, edit, and deactivate user accounts, so that access stays current with staffing changes.
- As an **administrator**, I want to assign roles to users, so that permissions match job responsibilities.

### Audit Monitoring
- As an **administrator**, I want to view an audit log of dataset changes and user actions, so that I can investigate anomalies or misuse.
- As an **administrator**, I want failed login attempts logged, so that I can detect potential unauthorized access attempts.

---

## 6. Functional Requirements

### Authentication
- FR-1: System shall support secure login with email/username + password.
- FR-2: System shall support logout that invalidates the active session/token.
- FR-3: System shall enforce session expiration after a configurable inactivity window.
- FR-4: System shall enforce role-based access control (RBAC) on every route and API endpoint.

### Data Management
- FR-5: System shall allow authorized users to upload datasets (CSV/XLSX/JSON, size-limited, chunked for large files).
- FR-6: System shall validate uploaded datasets against defined schemas before storage.
- FR-7: System shall preprocess datasets (cleaning, normalization) prior to making them available for analytics.
- FR-8: System shall store processed datasets in MongoDB with associated metadata.
- FR-9: System shall support dataset updates while preserving version history.
- FR-10: System shall track dataset status (Uploaded → Validating → Processing → Ready → Failed/Archived).

### Analytics
- FR-11: System shall compute aggregate statistics (counts, distributions, rates) on demand or on a caching schedule.
- FR-12: System shall generate trend data over selectable time windows.
- FR-13: System shall support region-to-region comparisons.
- FR-14: System shall generate dashboard-level summary metrics.

### Forecasting
- FR-15: System shall prepare historical time-series data for model input (aggregation, gap-filling, normalization).
- FR-16: System shall train/apply a forecasting model per region/resource combination.
- FR-17: System shall generate and store predictions with associated confidence indicators where supported.
- FR-18: System shall display forecast results alongside historical actuals.
- FR-19: System shall track and display model performance metrics (MAE, RMSE, MAPE).

### Reports
- FR-20: System shall generate exportable reports (PDF/CSV) from current analytics/forecast views.
- FR-21: System shall optionally retain a history of generated reports for retrieval.

### Administration
- FR-22: System shall allow administrators to create, edit, deactivate users.
- FR-23: System shall allow administrators to define and assign roles/permissions.
- FR-24: System shall log administrative and data-modification actions to an audit trail.

---

## 7. Database Entities (MongoDB)

MongoDB is a natural fit here because ASTRA's datasets vary in shape across dataset types (demographic vs. biometric vs. resource), and document flexibility avoids rigid schema migrations while still allowing strong validation via Mongoose schemas / MongoDB JSON Schema validators.

### 7.1 `User`
- **Purpose:** Authorized platform users.
- **Key fields:** `_id`, `name`, `email` (unique), `passwordHash`, `roleId` (ref), `department`, `status` (active/inactive), `lastLoginAt`, `createdAt`, `updatedAt`.
- **Relationships:** References `Role`. Referenced by `AuditLog`, `Dataset` (uploadedBy), `Report` (generatedBy).
- **Indexing:** Unique index on `email`; index on `roleId`.
- **Modeling choice:** Reference to `Role` (roles are shared/reused across many users — embedding would duplicate permission data).

### 7.2 `Role`
- **Purpose:** Defines a named role and its permission set (Administrator, Data Analyst, Resource Planning Officer, Department Officer).
- **Key fields:** `_id`, `name`, `permissions` (array of permission strings, embedded), `description`.
- **Relationships:** Referenced by `User`.
- **Modeling choice:** `permissions` embedded as an array since it's small, always accessed with the role, and rarely queried independently.

### 7.3 `Region` (with `State` / `District` as sub-types or a hierarchy)
- **Purpose:** Canonical geographic reference data.
- **Key fields:** `_id`, `name`, `type` (state/district), `parentRegionId` (ref, null for states), `code`.
- **Relationships:** Self-referencing hierarchy (`parentRegionId`). Referenced by `DemographicRecord`, `BiometricRecord`, `ResourceAllocation`, `Forecast`.
- **Indexing:** Index on `type` + `parentRegionId`; index on `code`.
- **Modeling choice:** Reference-based — regions are reused across millions of records, so embedding would massively duplicate data.

### 7.4 `Dataset`
- **Purpose:** Metadata and lifecycle tracking for each uploaded dataset (the records themselves live in `DemographicRecord`/`BiometricRecord`/`ResourceAllocation`, tagged with `datasetId`).
- **Key fields:** `_id`, `name`, `category` (demographic/biometric/resource), `sourceFileName`, `uploadedBy` (ref User), `status`, `version`, `qualityScore`, `rowCount`, `validationSummary` (embedded object: errors/warnings counts), `createdAt`, `updatedAt`.
- **Relationships:** Referenced by data records via `datasetId`; references `User`.
- **Indexing:** Index on `category`, `status`, `uploadedBy`.
- **Modeling choice:** `validationSummary` embedded (small, always read with the dataset); everything else referenced.

### 7.5 `DemographicRecord`
- **Purpose:** Aggregated demographic statistics — **never row-level PII**, but aggregate counts (e.g., "count of enrollments, age-band 18–25, female, District X, month Y").
- **Key fields:** `_id`, `datasetId` (ref), `regionId` (ref), `ageBand`, `gender`, `period` (date/month), `count`.
- **Indexing:** Compound index on `regionId + period`; index on `datasetId`.

### 7.6 `BiometricRecord`
- **Purpose:** Aggregated biometric enrollment/update statistics (counts only — no raw biometric templates ever).
- **Key fields:** `_id`, `datasetId` (ref), `regionId` (ref), `type` (enrollment/update), `ageBand`, `period`, `count`.
- **Indexing:** Compound index on `regionId + period + type`.

### 7.7 `Resource`
- **Purpose:** Catalog of resource types being allocated (e.g., enrollment kits, staffing units, enrollment centers).
- **Key fields:** `_id`, `name`, `unit`, `description`.
- **Relationships:** Referenced by `ResourceAllocation`, `Forecast`.

### 7.8 `ResourceAllocation`
- **Purpose:** Historical record of resource allocation by region/time.
- **Key fields:** `_id`, `datasetId` (ref), `resourceId` (ref), `regionId` (ref), `period`, `allocatedAmount`, `utilizedAmount` (optional), `demandIndicator` (optional computed field).
- **Indexing:** Compound index on `regionId + resourceId + period`.

### 7.9 `Forecast`
- **Purpose:** Stores generated forecast output.
- **Key fields:** `_id`, `resourceId` (ref), `regionId` (ref), `forecastModelId` (ref), `generatedBy` (ref User), `horizon` (e.g., 6 months), `predictions` (embedded array of `{period, predictedValue, lowerBound, upperBound}`), `createdAt`.
- **Modeling choice:** `predictions` embedded — it's an array that is always read together with its parent forecast and isn't queried independently.
- **Indexing:** Index on `regionId + resourceId`; index on `generatedBy`.

### 7.10 `ForecastModel`
- **Purpose:** Tracks which model/version produced a forecast, and its performance metrics.
- **Key fields:** `_id`, `algorithm` (e.g., "Prophet", "ARIMA", "LinearRegression"), `version`, `trainedAt`, `performanceMetrics` (embedded: `{mae, rmse, mape}`), `trainingDataRange`.
- **Relationships:** Referenced by `Forecast`.

### 7.11 `Report`
- **Purpose:** Tracks generated reports for history/re-download.
- **Key fields:** `_id`, `generatedBy` (ref User), `type`, `filters` (embedded snapshot of filter state), `fileUrl` (S3 location), `createdAt`.
- **Indexing:** Index on `generatedBy + createdAt`.

### 7.12 `AuditLog`
- **Purpose:** Immutable log of security-relevant and data-modification actions.
- **Key fields:** `_id`, `userId` (ref), `action` (enum: login, logout, upload, delete, roleChange, export, etc.), `targetType`, `targetId`, `metadata` (embedded object, action-specific), `ipAddress`, `timestamp`.
- **Indexing:** Index on `userId + timestamp`; index on `action`.
- **Modeling choice:** Append-only collection; consider a capped collection or TTL/archival strategy for very old entries per retention policy.

### 7.13 Handling large datasets efficiently
- Store only **aggregated/statistical records**, not raw row-level dumps where avoidable, to keep collections analytics-friendly.
- Use **compound indexes** aligned to the most common query patterns (region + period).
- Use **MongoDB aggregation pipelines** for on-the-fly rollups rather than pre-computing every possible view.
- Consider **time-bucketed collections** or MongoDB's time-series collection type for high-volume period-based data (enrollment/allocation records).
- Use **bulk writes** and **background index builds** during ingestion to avoid blocking reads.
- Archive old raw uploads to S3 and retain only processed/aggregated data in MongoDB long-term.

---

## 8. API Requirements

All endpoints are prefixed `/api/v1`. All endpoints except `/auth/login` require a valid JWT (`Authorization: Bearer <token>`). Authorization requirements are enforced via role/permission middleware.

### 8.1 Authentication

**POST `/api/v1/auth/login`**
- Purpose: Authenticate a government user.
- Body: `{ email, password }`
- Response: `{ token, refreshToken, user: { id, name, role } }`
- Auth: None (public endpoint, rate-limited).
- Errors: `401 Invalid credentials`, `423 Account locked`, `429 Too many attempts`.

**POST `/api/v1/auth/logout`**
- Purpose: Invalidate current session/token.
- Auth: Required.
- Response: `{ success: true }`
- Errors: `401 Unauthorized`.

**POST `/api/v1/auth/refresh`**
- Purpose: Exchange a valid refresh token for a new access token.
- Body: `{ refreshToken }`
- Response: `{ token }`
- Errors: `401 Invalid/expired refresh token`.

**GET `/api/v1/auth/session`**
- Purpose: Validate current session and return user context.
- Auth: Required.
- Response: `{ user: { id, name, role, permissions } }`
- Errors: `401 Unauthorized`.

### 8.2 Users & Roles

**GET `/api/v1/users`** — List users. Query: `role, status, page, limit`. Auth: Admin only. Errors: `403 Forbidden`.

**POST `/api/v1/users`** — Create user. Body: `{ name, email, roleId, department }`. Auth: Admin only. Errors: `409 Email exists`, `400 Validation error`.

**PATCH `/api/v1/users/:id`** — Update user (role, status, department). Auth: Admin only. Errors: `404 Not found`, `403 Forbidden`.

**DELETE `/api/v1/users/:id`** — Deactivate user (soft delete). Auth: Admin only. Errors: `404 Not found`.

**GET `/api/v1/roles`** — List roles and permissions. Auth: Admin only.

**PATCH `/api/v1/roles/:id`** — Update role permissions. Auth: Admin only.

### 8.3 Dashboard

**GET `/api/v1/dashboard/summary`** — Purpose: Top-level KPI cards (total records, datasets, recent updates). Auth: Any authenticated role. Response: `{ totalRecords, datasetCount, lastUpdated, ... }`.

**GET `/api/v1/dashboard/trends`** — Purpose: Trend summary widgets. Query: `period`. Auth: Any authenticated role.

### 8.4 Datasets

**POST `/api/v1/datasets/upload`** — Purpose: Upload a new dataset file. Body: multipart/form-data (`file`, `category`, `name`). Auth: Analyst/Admin. Response: `{ datasetId, status: "Validating" }`. Errors: `413 File too large`, `415 Unsupported format`.

**GET `/api/v1/datasets`** — Purpose: List/search datasets. Query: `category, status, region, dateFrom, dateTo, page, limit`. Auth: Any authenticated role (read scope per role).

**GET `/api/v1/datasets/:id`** — Purpose: Dataset detail + metadata + version history. Auth: Any authenticated role. Errors: `404 Not found`.

**GET `/api/v1/datasets/:id/status`** — Purpose: Poll processing status. Auth: Analyst/Admin.

**DELETE `/api/v1/datasets/:id`** — Purpose: Archive/soft-delete a dataset. Auth: Admin only. Errors: `403 Forbidden`, `404 Not found`.

### 8.5 Analytics

**GET `/api/v1/analytics/demographics`** — Query: `state, district, ageBand, gender, dateFrom, dateTo`. Purpose: Aggregated demographic stats. Auth: Analyst, Planning Officer, Department Officer, Admin.

**GET `/api/v1/analytics/biometrics`** — Query: `state, district, type, ageBand, dateFrom, dateTo`. Purpose: Aggregated biometric trend stats. Auth: Same as above.

**GET `/api/v1/analytics/regional`** — Query: `regionIds[], metric, dateFrom, dateTo`. Purpose: Multi-region comparison. Auth: Same as above.

**GET `/api/v1/analytics/resources`** — Query: `state, district, resourceId, dateFrom, dateTo`. Purpose: Resource allocation analytics, including under/over-allocation indicators. Auth: Planning Officer, Department Officer, Admin (Analyst read-only if permitted).

### 8.6 Forecasting

**POST `/api/v1/forecasts`** — Purpose: Generate a new forecast. Body: `{ resourceId, regionId, horizon }`. Auth: Planning Officer, Admin. Response: `{ forecastId, status: "Processing" }`. This call proxies to the Python ML service internally. Errors: `422 Insufficient historical data`, `503 ML service unavailable`.

**GET `/api/v1/forecasts/:id`** — Purpose: Retrieve a specific forecast result. Auth: Planning Officer, Department Officer, Admin. Errors: `404 Not found`.

**GET `/api/v1/forecasts`** — Purpose: List/filter forecast history. Query: `regionId, resourceId, dateFrom, dateTo`. Auth: Same as above.

**GET `/api/v1/forecasts/:id/performance`** — Purpose: Return model performance metrics for a forecast's underlying model. Auth: Planning Officer, Admin.

### 8.7 Reports

**POST `/api/v1/reports`** — Purpose: Generate a report from current filter/analytics state. Body: `{ type, filters }`. Auth: Any authenticated role with export permission. Response: `{ reportId, fileUrl }`.

**GET `/api/v1/reports/:id`** — Purpose: Retrieve/download a previously generated report. Auth: Owner or Admin. Errors: `404 Not found`, `403 Forbidden`.

**GET `/api/v1/reports`** — Purpose: List report history for current user. Auth: Any authenticated role.

### 8.8 Audit

**GET `/api/v1/audit/logs`** — Query: `userId, action, dateFrom, dateTo, page, limit`. Purpose: Retrieve audit trail. Auth: Admin only. Errors: `403 Forbidden`.

---

## 9. Authentication & Authorization

### Architecture
- **Login:** Email + password against `User` collection; password verified with **bcrypt** hash comparison.
- **Token scheme:** JWT access token (short-lived, ~15 min) + refresh token (longer-lived, ~7 days, stored server-side or as httpOnly cookie) to support silent renewal without keeping long-lived tokens in local storage.
- **Password hashing:** bcrypt with a strong work factor (e.g., cost factor 12).
- **Session expiration:** Access token expiry enforced server-side; inactivity-based session expiry enforced by refresh-token TTL.
- **Password reset:** Admin-initiated reset flow (no self-service public reset, since there's no public-facing registration) — admin triggers a reset link sent to the user's registered government email, single-use, time-limited token.
- **Account lockout:** Lock account after N (e.g., 5) consecutive failed login attempts within a window; require admin unlock or timed cooldown.
- **Login rate limiting:** IP- and account-based rate limiting on `/auth/login` to blunt brute-force attempts.
- **Password requirements:** Minimum length, mixed character classes, rejection of common/breached passwords (e.g., via a check against a known-bad-password list).
- **Logout / token invalidation:** Refresh token revoked server-side on logout; access token allowed to expire naturally (short TTL limits exposure).
- **Audit logging:** All login attempts (success and failure), logouts, and permission-denied events logged to `AuditLog`.

### Role Permissions Matrix

| Module | Administrator | Data Analyst | Resource Planning Officer | Department Officer |
|---|---|---|---|---|
| Dashboard | Full | View | View | View |
| Dataset Management (upload/edit) | Full | Upload/Edit (own) | — | — |
| Dataset Management (view) | Full | Full | View | View |
| Demographic Analytics | Full | Full | View | View |
| Biometric Analytics | Full | Full | View | View |
| Resource Allocation Analytics | Full | View | Full | View |
| Forecasting (generate) | Full | — | Full | — |
| Forecasting (view) | Full | View | Full | View |
| Reports/Export | Full | Full | Full | View + Export |
| User Management | Full | — | — | — |
| Role Management | Full | — | — | — |
| Audit Logs | Full | — | — | — |

---

## 10. Data Processing & Machine Learning Pipeline

**Pipeline:** Dataset Upload → Validation → Cleaning → Preprocessing → MongoDB Storage → Analytics → Feature Preparation → ML Forecasting → Forecast Storage → Dashboard Visualization

### Stages
- **Validation:** Structural checks (required columns present, correct types), followed by business-rule checks (valid region codes, valid date ranges, non-negative counts).
- **Missing-value handling:** Flag and either impute (e.g., carry-forward for time series, regional median for demographic gaps) or exclude records below a completeness threshold — decision logged in `Dataset.validationSummary`.
- **Duplicate detection:** Hash-based detection on natural keys (region + period + category) to flag/reject duplicate rows.
- **Invalid records:** Quarantined into a rejected-records log rather than silently dropped, so analysts can review.
- **Outlier detection:** Statistical methods (e.g., z-score or IQR-based) to flag abnormal spikes for analyst review before they feed forecasting.
- **Normalization:** Standardize units, date formats, and region naming against the canonical `Region` reference collection.
- **Aggregation:** Row-level uploads are aggregated into the statistical record shapes (`DemographicRecord`, `BiometricRecord`, `ResourceAllocation`) at ingestion time.
- **Feature engineering:** For forecasting — lag features, rolling averages, seasonal indicators (month/quarter), region-level categorical encoding.
- **Time-series preparation:** Resampling to a consistent period (monthly), gap-filling, and train/validation split by time (not random split, to avoid leakage).

### Node.js ↔ Python Communication
The Node/Express backend does **not** run ML training itself. Instead:
- The Python ML service is exposed as an internal REST microservice (e.g., FastAPI or Flask) reachable only from the Node backend (internal network / VPC, not public internet).
- Node's `/api/v1/forecasts` endpoint validates the request, then makes an internal HTTP call to the Python service (e.g., `POST http://ml-service/forecast`) with the prepared feature set.
- The Python service trains/applies the model, returns predictions + confidence intervals + performance metrics as JSON.
- Node persists the result to the `Forecast` and `ForecastModel` collections and returns the result to the frontend.
- This keeps the Node API layer thin and lets the ML service scale/deploy independently.

### Recommended Forecasting Approach (MVP)
- **Primary recommendation: Facebook Prophet (Python `prophet` package).** It handles seasonality, missing data, and trend changes well out of the box, requires relatively little tuning, and produces confidence intervals natively — a good fit for a realistic student/academic MVP with limited data-science tuning time.
- **Simpler fallback / baseline: Linear Regression or Moving Average**, used as a baseline to benchmark Prophet against, and as a fallback when a region/resource combination has too little history for Prophet to fit reliably.
- **Alternatives considered:**
  - *ARIMA* — strong for pure time series but requires more manual tuning (order selection) and is more sensitive to non-stationarity.
  - *Random Forest / XGBoost* — capable of capturing non-linear relationships across many features but requires richer feature sets and more data than a student MVP will likely have; better suited to Future Scope.
- **MVP decision:** Use Prophet as the primary model with a Moving-Average/Linear-Regression baseline shown side by side for transparency, and surface MAE/RMSE/MAPE so users can judge trustworthiness.

---

## 11. Edge Cases

| Edge Case | Handling Strategy |
|---|---|
| Missing data in uploaded dataset | Flag rows, apply configured imputation or exclusion rule, record in `validationSummary`, surface to analyst |
| Duplicate records | Detect via natural-key hashing; reject or merge per configured policy; log to rejected-records report |
| Invalid records (bad types, out-of-range values) | Quarantine into rejected-records log; dataset moves to "Partially Valid" status rather than silently proceeding |
| Corrupted dataset upload | Fail fast with a clear error at the parsing stage; dataset marked "Failed"; nothing partially persisted |
| Unsupported file formats | Reject at upload with `415` and a list of supported formats |
| Incorrect date formats | Attempt configured format parsing; if unparseable, quarantine the row |
| Invalid geographic information (unknown region code) | Reject or flag for manual mapping against canonical `Region` collection |
| Insufficient historical data for forecasting | Block forecast generation with a clear `422` message; suggest minimum required history; offer baseline (moving average) if borderline |
| Zero-resource regions | Display explicitly as "No allocation recorded" rather than as zero/blank, to avoid misreading as a data gap |
| Sudden abnormal spikes | Flag via outlier detection; show with a visual indicator on charts; excluded from model training by default with an override option |
| No results after filtering | Show an explicit empty-state message with a suggestion to broaden filters, not a blank chart |
| Forecast model failure (e.g., non-convergence) | Catch and fall back to baseline model; log the failure; inform the user the result is a fallback |
| Poor forecast accuracy (validated against holdout) | Surface performance metrics prominently; flag low-confidence forecasts visually |
| API failures | Standardized error envelope; frontend shows retry option; no silent failures |
| Database failures | Retry with backoff for transient errors; circuit-breaker pattern for sustained outages; graceful degraded UI |
| Large dataset processing | Chunked upload + background job queue; progress/status polling endpoint; no synchronous blocking request |
| Unauthorized access attempts | Return `403`; log to `AuditLog`; do not leak whether the resource exists |
| Expired sessions | Silent refresh via refresh token where valid; otherwise redirect to login with a clear "session expired" message |
| Concurrent dataset updates | Optimistic locking via a version field on `Dataset`; reject conflicting writes with a clear conflict error |

---

## 12. Security & Privacy Requirements

- **Data anonymization:** All demographic and biometric analytics operate on **aggregated counts**, never on row-level individual records tied to an Aadhaar number.
- **No exposure of Aadhaar numbers:** Aadhaar numbers are never ingested, stored, displayed, or logged by ASTRA. Source datasets used for demonstration must already be anonymized/synthetic/public before ingestion.
- **No exposure of raw biometric data:** Fingerprint/iris/biometric templates are never stored; only aggregate enrollment/update counts.
- **Role-based access control:** Enforced at both API and UI layers, per the permissions matrix in Section 9.
- **Encryption in transit:** HTTPS/TLS enforced for all client-server and internal service-to-service (Node ↔ Python ML) communication.
- **Encryption at rest:** MongoDB encryption at rest (e.g., via encrypted EBS volumes / MongoDB Atlas encryption); S3 buckets for file storage use server-side encryption.
- **Secure API communication:** JWT-based auth on every request; internal ML service not exposed to the public internet.
- **Audit logging:** All authentication events, data modifications, exports, and admin actions logged immutably.
- **Data access monitoring:** Anomalous access patterns (e.g., bulk export by an unusual account) flagged for admin review.
- **Secure AWS infrastructure:** Private subnets for backend/database/ML service; security groups restricting inbound traffic; least-privilege IAM roles.
- **Backup and recovery:** Scheduled automated MongoDB backups (e.g., daily snapshots) with a defined retention window and tested restore procedure.
- **Data retention policy:** Define retention periods for raw uploads (archived to cold storage after processing), audit logs (retained per compliance requirement), and reports.

---

## 13. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard summary loads in < 2s under normal load; analytics queries return in < 3s for typical filter combinations |
| Scalability | Backend and ML service horizontally scalable behind a load balancer; MongoDB indexed/sharded as data volume grows |
| Availability | Target 99.5% uptime for an internal government tool (excludes planned maintenance windows) |
| Security | See Section 12 in full |
| Reliability | Background jobs (dataset processing, forecasting) are retried on transient failure and are idempotent |
| Maintainability | Modular Express route/controller/service structure; documented API contracts; consistent coding standards enforced via lint in CI |
| Accessibility | Frontend follows WCAG 2.1 AA guidance where practical (keyboard navigation, color contrast, ARIA labels on charts) |
| Responsiveness | UI usable on standard desktop and tablet viewports (primary use case is desktop, given the analyst persona) |
| Logging | Structured application logs (request IDs, error stack traces) shipped to a central log store |
| Monitoring | Health-check endpoints for backend and ML service; basic uptime/error-rate alerting |
| Error handling | Consistent error envelope across all APIs; no raw stack traces returned to the client |
| Data integrity | Schema validation on write (Mongoose/JSON Schema); referential checks on region/resource IDs before persistence |

---

## 14. System Architecture

**High-level flow:**

`React.js (SPA)` → `Node.js/Express REST API` → `MongoDB`
`Node.js Backend` ↔ `Python ML/Forecasting microservice` (internal-only)
Deployment/infra: `AWS`
Version control/CI: `GitHub` + `GitHub Actions`

### Layer breakdown
- **Frontend (React.js):** SPA with route-based code splitting; a charting library suited to React (e.g., Recharts or Chart.js via a React wrapper) for KPI cards, line/bar/pie/area charts, heatmaps; a mapping library (e.g., Leaflet or a React wrapper) for state/district choropleth maps. State management via React Query (or similar) for server-state caching, plus local component state for filters.
- **Backend (Node.js/Express):** Layered as routes → controllers → services → data-access layer. Auth middleware (JWT verification + RBAC) applied globally with per-route permission checks. A job queue (e.g., BullMQ backed by Redis) handles async dataset processing and forecast generation so API requests return immediately with a job/status handle.
- **REST API layer:** Versioned (`/api/v1`), documented (OpenAPI/Swagger), consistent response envelope.
- **Database layer (MongoDB):** As modeled in Section 7, with compound indexes aligned to filter/query patterns.
- **ML service (Python):** A lightweight internal REST service (FastAPI recommended for its speed and automatic OpenAPI docs) that exposes `/forecast` and `/health`. Not reachable from the public internet — only from the Node backend within the VPC.
- **Data processing pipeline:** Implemented as background jobs triggered on upload, running the validation/cleaning/aggregation stages described in Section 10, updating `Dataset.status` as it progresses.
- **Authentication layer:** JWT issuance/verification in the Node backend; bcrypt for password hashing; refresh-token rotation.
- **File/data storage:** Raw uploaded files stored in Amazon S3 (not in MongoDB); MongoDB stores only processed/structured data plus a pointer to the raw file in S3 for traceability.
- **Monitoring and logging:** CloudWatch for infrastructure/application logs and basic alerting.
- **CI/CD pipeline:** GitHub Actions, detailed in Section 15.

### Logical Architecture Diagram (description)

```
[React SPA] 
     |  HTTPS
     v
[AWS ALB] 
     |
     v
[Node.js/Express API (ECS/EC2)] ---- internal HTTPS ----> [Python ML Service (ECS/EC2)]
     |
     +--> [MongoDB (Atlas or self-managed on EC2)]
     |
     +--> [Amazon S3 (raw dataset files, exported reports)]
     |
     +--> [Redis (job queue for async processing)]

[CloudWatch] <--- logs/metrics --- [all backend components]
[GitHub Actions] ---> deploys to ---> [AWS]
```

---

## 15. GitHub Actions & Testing

### Automated Testing
- **Frontend tests:** Component tests (React Testing Library) for key UI components (filters, charts rendering, dashboard cards); a small suite of end-to-end smoke tests (e.g., Playwright/Cypress) covering login → dashboard → filter → view chart.
- **Backend API tests:** Unit tests for services/controllers (Jest/Mocha + Supertest for HTTP-level tests); tests for auth middleware and RBAC enforcement specifically, since that's security-critical.
- **Integration tests:** Dataset upload → validation → storage pipeline tested end-to-end against a test MongoDB instance (e.g., via `mongodb-memory-server`).
- **ML/forecasting tests:** Python unit tests (pytest) validating the forecasting service's input handling, output shape, and behavior on edge cases (e.g., insufficient data → graceful error, not a crash).

### GitHub Actions Pipeline

```
Push / Pull Request
   → Install Dependencies (Node + Python)
   → Lint (ESLint for JS/TS, Flake8/Black for Python)
   → Run Unit Tests (frontend + backend + ML)
   → Run Integration Tests
   → Build (frontend build, backend build)
   → Run ML Service Tests
   → Deploy (on merge to main only, to staging first, then manual promote to production)
```

### Suggested separate workflows
- `ci.yml` — runs on every PR: lint + unit tests + integration tests (fast feedback).
- `build-and-deploy.yml` — runs on merge to `main`: build artifacts, run full test suite including ML tests, deploy to staging, require manual approval gate before production deploy.
- `ml-tests.yml` — can run on any change under the `/ml-service` path, so Python-only changes don't wait on the full frontend/backend suite.

### Preventing broken deployments
- Branch protection on `main` requiring the CI workflow to pass before merge.
- Required status checks (lint + tests) block merge on failure.
- Staging deploy + smoke test gate before any production promotion.
- Rollback plan: keep the previous deployed build artifact/image tagged and deployable via a one-click GitHub Actions re-run.

---

## 16. AWS Deployment

Recommended services, chosen for meaningful value rather than exhaustive coverage:

| Need | Service | Why |
|---|---|---|
| React frontend hosting | **S3 + CloudFront** | Cheap, fast static hosting with CDN edge caching; simple CI deploy target |
| Node.js backend hosting | **ECS (Fargate)** or EC2 | Fargate avoids server management overhead, scales containers on demand; EC2 is a simpler fallback for a student-scale deployment |
| MongoDB | **MongoDB Atlas** (managed) | Managed backups, encryption at rest, and scaling without operating MongoDB infrastructure directly; alternatively self-hosted on EC2 if Atlas isn't permitted |
| Python ML service | **ECS (Fargate)**, internal-only service | Same operational model as the Node backend; kept on a private subnet, reachable only from the backend |
| Dataset/file storage | **S3** | Durable, cheap object storage for raw uploads and generated reports |
| Job queue | **Amazon ElastiCache (Redis)** | Backs the async job queue for dataset processing and forecast generation |
| Auth/security | **IAM roles + Security Groups + AWS Secrets Manager** | Least-privilege access between services; secrets (DB creds, JWT signing key) never hardcoded |
| Logging | **CloudWatch Logs** | Central log aggregation for backend, ML service, and infra |
| Monitoring | **CloudWatch Alarms** | Basic uptime/error-rate/queue-depth alerting |
| Backups | **Atlas automated backups** (or AWS Backup for self-managed) | Scheduled snapshots with defined retention |

Services intentionally **not** recommended for this scope: multi-region active-active setups, complex service mesh (App Mesh), or a full data-lake/analytics stack (Redshift, Athena) — unnecessary for a platform at this scale and would add operational overhead beyond what a student/academic MVP needs.

---

## 17. MVP Scope

### Must Have (MVP)
1. Secure government-user authentication (login/logout, JWT, RBAC)
2. Role-based access control across all four personas
3. Dataset management (upload, validation, status tracking)
4. Dataset validation and preprocessing pipeline
5. MongoDB data storage per the Section 7 model
6. Interactive analytics dashboard (KPI cards, summary widgets)
7. Demographic analytics (age/gender/region distribution, trends)
8. Biometric analytics (aggregate enrollment/update trends)
9. Resource allocation analytics (by region, historical trends, under/over-allocation indicators)
10. Interactive filtering (state, district, date range, age group, gender)
11. Basic resource allocation forecasting (Prophet + moving-average baseline)
12. Forecast visualization (historical vs. predicted, confidence band)
13. Basic reports/export (PDF/CSV of current view)
14. Audit logging (login events, data modifications, admin actions)
15. Automated testing + CI via GitHub Actions

### Explicitly Excluded from MVP
- AI-powered decision support / natural-language querying
- Automated resource allocation recommendations
- What-if simulation tooling
- Real-time data integration (MVP is batch-upload based)
- Advanced geospatial analytics beyond basic choropleth maps
- Automated predictive alerting
- Cross-department analytics
- Mobile/tablet-optimized interface (desktop-first for MVP)
- Advanced ML models beyond Prophet/baseline (e.g., XGBoost ensembles)

This scope is intentionally sized to be achievable within a typical academic/student project timeline while still demonstrating the full data pipeline (ingestion → analytics → forecasting) end to end.

---

## 18. Future Scope

### AI-Powered Decision Support System (Future)
- AI-generated insights summarizing "what changed and why" across a region/period
- Automated resource allocation recommendations
- Natural-language query interface ("Why did demand increase in District X?")
- What-if simulation (model the effect of a hypothetical allocation change)
- Resource optimization suggestions
- Automated anomaly detection with proactive alerts
- Policy impact analysis (before/after comparison around a policy change)
- AI-generated narrative reports
- Predictive alerts (e.g., "Region X projected to exceed capacity in 3 months")
- Conversational analytics interface

### Other Future Enhancements
- More advanced forecasting models (ensemble methods, deep learning time-series models)
- Real-time/streaming data integration instead of batch upload
- Advanced geospatial analytics (heatmap density modeling, spatial clustering)
- Automated alerting/notification system
- Cross-department analytics correlation
- Mobile/tablet-native interface
- Expanded predictive analytics (multi-resource joint forecasting)

**Note:** The AI decision-support layer is a clearly separated future phase. It is not part of MVP scope, and the current architecture (Node ↔ Python ML microservice) is designed to make this a natural extension rather than a rearchitecture — the same internal ML service boundary can later host LLM-based reasoning components.

---

## 19. User Flows

### Government Officer / Department Officer
`Login → Dashboard → Select Region/Dataset → Apply Filters → Analyze Demographics/Biometrics → Review Resource Allocation → View Forecast → Generate/Export Report`

### Data Analyst
`Login → Dataset Management → Upload Dataset → Validate → Process → Analyze → Generate Insights → Export Results`

### Resource Planning Officer
`Login → Resource Dashboard → Select Region/Resource → Analyze Historical Allocation → Generate Forecast → Review Predicted Requirement → Export Forecast`

### Administrator
`Login → Admin Dashboard → Manage Users → Manage Roles → Monitor Datasets → Review Audit Logs`

---

## 20. Success Metrics

| Metric | Target/Purpose |
|---|---|
| Dashboard response time | < 2s for summary load |
| Dataset processing success rate | > 95% of valid uploads processed without manual intervention |
| Forecast accuracy (MAPE) | Tracked per model; used to flag low-confidence forecasts, not a fixed pass/fail bar |
| API response time | < 3s for 95th percentile of analytics queries |
| System uptime | ≥ 99.5% |
| Failed authentication rate | Monitored for spikes indicating brute-force attempts |
| Data validation accuracy | % of uploaded rows passing validation without manual correction |
| Report generation time | < 10s for standard report |
| User activity | Active users per role per period (adoption signal) |
| Forecast coverage | % of region/resource combinations with a usable forecast (sufficient history) |

---

## 21. Risks & Mitigation

| Risk | Mitigation |
|---|---|
| Data quality issues in source datasets | Multi-stage validation pipeline; rejected-records reporting; quality score surfaced per dataset |
| Privacy risk (accidental PII exposure) | Aggregation-only data model; no raw Aadhaar numbers or biometric templates ever ingested; access reviews |
| Security risk (unauthorized access) | RBAC, MFA-ready auth design, rate limiting, audit logging, least-privilege AWS IAM |
| ML prediction errors | Baseline model comparison, confidence intervals, performance metrics surfaced to users, fallback on model failure |
| Insufficient historical data for forecasting | Minimum-history threshold with clear user messaging; baseline model fallback |
| Dataset scaling issues | Indexed aggregation model, chunked upload, background processing, time-series-oriented storage |
| Infrastructure cost overruns | Right-sized service selection (Section 16), Fargate scale-to-zero where feasible for non-critical services, budget alarms |
| API failures | Retry/backoff, circuit breakers, standardized error handling, health checks |
| Unauthorized access attempts | Account lockout, rate limiting, audit logging, anomaly monitoring |
| Incorrect resource forecasts influencing real decisions | Confidence indicators, explicit "forecast, not guarantee" framing in UI, human-in-the-loop review before decisions are acted on |

---

## 22. Feature Prioritization (MoSCoW)

| Feature | Priority | MVP/Future | Reason |
|---|---|---|---|
| Authentication & RBAC | Must Have | MVP | Security foundation |
| Dataset Management & Validation | Must Have | MVP | Core data pipeline |
| Government Dashboard | Must Have | MVP | Core visibility |
| Demographic Analytics | Must Have | MVP | Core analytical value |
| Biometric Analytics | Must Have | MVP | Core analytical value |
| Resource Allocation Analytics | Must Have | MVP | Core planning value |
| Resource Allocation Forecasting | Must Have | MVP | Primary differentiator |
| Interactive Filtering | Must Have | MVP | Usability of analytics |
| Reports & Export | Should Have | MVP | High value, lower complexity |
| Audit Logging | Should Have | MVP | Security/compliance |
| GitHub Actions CI/CD | Should Have | MVP | Engineering quality |
| Geographic Map Visualizations | Should Have | MVP | High visual value |
| Advanced Forecast Model Comparison | Could Have | Future | Nice-to-have depth |
| Real-time Data Integration | Could Have | Future | Requires infra beyond MVP scope |
| Cross-department Analytics | Could Have | Future | Requires data not in MVP |
| Mobile/Tablet Interface | Could Have | Future | Desktop-first sufficient for MVP |
| AI Decision Support System | Future | Future | Advanced capability, separate phase |
| Natural-Language Query Interface | Future | Future | Depends on AI layer |
| What-If Simulation | Future | Future | Depends on AI layer |
| Automated Predictive Alerts | Future | Future | Requires monitoring infra beyond MVP |

---

## 23. Final Product Summary

**ASTRA (Aadhaar Statistical Trends & Resource Analytics)** is an internal government analytics and forecasting platform built for authorized personnel — administrators, data analysts, resource planning officers, and department decision-makers — to manage, explore, and forecast from Aadhaar-related demographic, biometric, and resource-allocation datasets.

It exists to solve a specific, recurring problem: government data on demographics, biometrics, and resource allocation is fragmented, hard to explore, and analyzed reactively rather than predictively. ASTRA centralizes that data (using anonymized, synthetic, or publicly available datasets for development), layers interactive analytics and cross-region comparison on top, and adds time-series forecasting so that resource planning can shift from reactive to proactive.

Its two primary capabilities are **(1) Aadhaar-related data analytics** — demographic, biometric, and resource-allocation insight generation across regions and time — and **(2) resource allocation forecasting** — historical-data-driven prediction of future demand using models like Prophet, benchmarked against simpler baselines.

Architecturally, ASTRA is built on **React.js** (frontend), **Node.js/Express.js** (REST API), **MongoDB** (data storage), a dedicated **Python** ML microservice for forecasting, **AWS** for deployment and infrastructure, and **GitHub + GitHub Actions** for version control and CI/CD.

The **MVP** delivers the full pipeline end to end — secure role-based authentication, dataset ingestion and validation, demographic/biometric/resource analytics, interactive filtering, basic forecasting with visualization, exportable reports, and audit logging — sized to be realistically achievable as an academic/student project.

Beyond the MVP, ASTRA is designed to evolve into an **AI-powered government decision-support platform**, adding natural-language querying, automated insight generation, what-if simulation, and proactive predictive alerting — building on the same Node ↔ Python service boundary already established, without requiring a rearchitecture.

ASTRA is, and remains, an **internal government tool**. It has no public registration, no citizen-facing features, and is never intended to interact directly with Aadhaar holders or expose personally identifiable Aadhaar information.
