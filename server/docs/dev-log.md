# DAY 1 – Project Setup

## Setup

- Basic **project initialization** completed.
- Installed core dependencies (`express`, `mongoose`, `dotenv`, `cors`, etc.).
- Folder structure created: `models`, `routes`, `controllers`, `middleware`, `config`,`db`,`utils`.

## Utilities Implemented

- **Cloudinary**
  - Integrated in `utils` for **future image uploads**.
- **APIError Class**
  - Standardized error handling across the project.
  - Ensures consistent error responses instead of different formats.

- **APIResponse Class**
  - Generic response class.
  - Allows sending structured responses consistently.

  ## File Upload Setup

- **Multer**: middleware to handle temporary file uploads to `./public/temp`.
- **Cloudinary**: configured for cloud storage of files/images.
- `uploadOnCloudinary` function handles uploading local files to Cloudinary and removing the temp file if upload fails.

## Notes on Async Handling

- **No asyncHandler used**, because **Express 5** now automatically handles async route errors with try/catch.

# DAY 2 – Authentication System

## Models & Utilities

- **User model (Pharmacy)** with validation and required fields.
- **Password hashing** implemented in model (pre-save hook).
- **JWT utilities**: `generateToken` and `verifyToken` for token creation and verification.
- **Cookie helper**: sets JWT in httpOnly, secure cookies.

## Controllers & Routes

- **Register API (Pharmacy)**
  - Validates required fields.
  - Checks for duplicate emails.
  - Creates a new pharmacy user.
  - Generates JWT token and sets it in cookie.
  - Returns structured response with minimal user info (name, email).

- **Login API (Pharmacy)**
  - Validates email and password.
  - Generates JWT token and sets it in cookie.
  - Returns structured success response.

- **Routes**
  - `POST /api/pharmacy/Register` → Register pharmacy
  - `POST /api/pharmacy/Login` → Login pharmacy

## Testing & Verification

- Registration and login tested in Postman.
- Cookie set successfully after registration and login.
- Duplicate email registration returns proper error.
- Login works only with correct JSON payload (`email`, `password`).

## Auth Middleware

- Extracts JWT token from cookies.
- If no token → throws `401 Unauthorized`.
- If invalid token → throws `401 Invalid Token`.
- If valid → decodes token, attaches `req.user` (id + role) for downstream routes.

## Protected Route Example

- Added `/api/pharmacy/protected`.
- Uses `authMiddleware`.
- Returns `user` info from decoded token if access is granted.

## Verification Done

- Tested flow:
  - Register/Login → token set in cookies.
  - Hitting `/protected` with token → success.
  - Without token → error response.

# DAY 3 – (Amendments to previous work)

## Model Updates

### Pharmacy Model

- Added **location fields** for better shift filtering and future geo-based features:
  - `addressLine` (String, required)
  - `city` (String, required)
  - `state` (String, optional)
  - `country` (String, required)
  - `postalCode` (String, optional)

### Pharmacist Model

- Added the same **location fields** as Pharmacy:
  - `addressLine`, `city`, `state`, `country`, `postalCode`

## Controller Updates

### RegisterPharmacy

- Now validates that `addressLine`, `city`, and `country` are provided during registration.
- Ensures more complete data collection for location-based features.

## Reasoning Behind Changes

- These fields will allow **location-aware filtering** of shifts later (e.g., pharmacists see nearby pharmacies).
- Provides better user experience by avoiding irrelevant shift listings.
- Keeps the schema future-proof for geolocation enhancements (distance-based search, city filters).

---

✅ Amendments complete.  
🚧 Next: Full **Shift Model** design + validation.

# DAY 3 – Core Models & Validation

## Morning (2 hrs)

### Shift Model

- Finalized and documented **MongoDB schema design** for core entities.
- Implemented the **Shift model** with fields:
  - `pharmacyId`
  - `date`
  - `startTime`
  - `endTime`
  - `hourlyRate`
  - `status`
  - `requirements`
  - `description`
  - `urgency`
  - `shiftType`
  - `maxApplicants`
  - `applications`
  - `confirmedPharmacistId`
  - `notes`
- Added **compound index** on `(date + startTime + endTime)` to support **conflict detection logic**.

---

## Afternoon (1.5 hrs)

### Application Model

- Implemented the **Application model** with references to:
  - `shiftId`
  - `pharmacistId`
- Added **status tracking**:
  - `applied`
  - `accepted`
  - `rejected`

### Validation Layer (Joi)

- **CreateShiftSchema**:
  - Required fields: `date`, `startTime`, `endTime`, `hourlyRate`
  - Optional fields with defaults: `requirements`, `description`, `urgency`, `shiftType`, `maxApplicants`
- **UpdateShiftSchema**:
  - All fields optional
  - Consistent validation rules with creation schema

---

## Backend Responsibilities vs. User Input

- `pharmacyId` comes from **logged-in user** (`req.user.id`), not request body.
- `status` defaults to **"open"** on creation.
- `applications` array and `confirmedPharmacistId` are **backend-managed**:
  - Only modified when pharmacists apply or are confirmed.

---

## Application Workflow Clarified

- Each **pharmacist application** creates a new **Application document**.
- That document’s **ID is pushed** into the parent shift’s `applications` array.

# DAY 4 – Shift Management APIs

## Morning (2 hrs)

### Create Shift API

- Implemented **CreateShift controller**:
  - Accepts validated input from request body.
  - Attaches `pharmacyId` from `req.user.id`.
  - Persists shift to DB with defaults (`status: open`, `urgency: normal`, `shiftType: regular`).
  - Returns structured `ApiResponse` including created shift.

- Added **role-based access control**:
  - `requireRole("pharmacy")` middleware restricts access to pharmacies.
  - `authMiddleware` validates JWT from cookies before role check.

- Defined route in `ShiftRouter`:
  - `POST /api/shifts/create`

- Middleware execution order:
  1. `authMiddleware` → ensure request has valid JWT.
  2. `requireRole("pharmacy")` → ensure only pharmacies can create shifts.
  3. `validate(CreateShiftSchema)` → validate request body.
  4. `CreateShift` controller → create shift in database.

  ### Lightweight Security

- Added **Helmet** middleware:
  - Automatically sets secure HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.).
- Added **express-rate-limit** middleware:
  - Restricts each IP to **100 requests per 15 minutes**.
  - Prevents brute force attacks and abuse.
  - Returns `429 Too Many Requests` when exceeded.

### API Documentation

**Endpoint:** `POST /api/shifts/create`  
**Auth:** Required (Pharmacy only)

**Request Body:**

```json
{
  "date": "2025-10-01",
  "startTime": "2025-10-01T09:00:00Z",
  "endTime": "2025-10-01T17:00:00Z",
  "hourlyRate": 40,
  "requirements": "Must be licensed",
  "description": "Day shift with high patient load",
  "urgency": "normal",
  "shiftType": "regular",
  "maxApplicants": 3
}
```

**Response (201 Created):**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "68d9067b8041234bb94cb49d",
    "pharmacyId": "68d5103167aa006b8768ee27",
    "date": "2025-10-01T00:00:00.000Z",
    "startTime": "2025-10-01T09:00:00.000Z",
    "endTime": "2025-10-01T17:00:00.000Z",
    "hourlyRate": 40,
    "status": "open",
    "urgency": "normal",
    "shiftType": "regular",
    "maxApplicants": 3,
    "applications": [],
    "confirmedPharmacistId": null,
    "createdAt": "2025-09-28T09:57:15.277Z",
    "updatedAt": "2025-09-28T09:57:15.277Z",
    "__v": 0
  },
  "message": "New Shift Created Successfully,in DB",
  "success": true,
  "timestamp": "2025-09-28T09:57:15.410Z"
}
```

# Day 5 – Application System & Conflict Algorithm

## Morning (2 hrs)

### Apply to Shift API

- Pharmacist applies to a shift.
- Validations:
  - Shift exists and is `open`.
  - Pharmacist hasn’t already applied.
- Creates new `Application` document.
- Pushes application ID into `Shift.applications`.
- Returns structured `ApiResponse`.

**Endpoint:** `POST /api/pharmacist/apply/:shiftId`  
**Auth:** Required (Pharmacist only)

---

### Conflict Detection for Shifts

- Prevent pharmacies from creating overlapping shifts.
- Validations:
  - Valid dates.
  - `startTime < endTime`.
  - Same calendar day.
  - No past shifts.
- Overlap rule:  
  New shift overlaps if `newStart < existingEnd` AND `newEnd > existingStart`.

---

## Afternoon (1.5 hrs)

### ShowApplicants API

**Endpoint:** `GET /shifts/:shiftId/applicants`  
**Auth:** Required (Pharmacy only)

- Pharmacy fetches all applicants for their shift.
- Populates pharmacist info (`name`, `email`).
- Authorization ensures only the posting pharmacy can view.

---

### Pharmacist Authentication (Register & Login)

**Register Pharmacist** – `POST /pharmacist/register`

- Validates body with Joi.
- Checks unique email + licenseNumber.
- Creates new pharmacist (hashes password).
- Issues JWT token in cookie.

**Login Pharmacist** – `POST /pharmacist/login`

- Validates email + password.
- Finds pharmacist, compares password.
- Issues JWT token in cookie.

---

## Accept / Reject Applications

**Accept Application** – `POST /pharmacy/applications/:applicationId/accept`

- Verify pharmacy owns shift.
- Mark one application as `accepted`.
- Auto-reject all others.
- Mark shift as `filled` and set `confirmedPharmacistId`.

**Reject Application** – `POST /pharmacy/applications/:applicationId/reject`

- Verify pharmacy owns shift.
- If still `applied`, mark as `rejected`.
- Shift stays `open`.
- Useful for shortlisting.

---

### DB Indexing

- **Application Schema**:  
  `{ shiftId, pharmacistId }` unique → prevents duplicate applications.

- **Shift Schema**:  
  `{ date, startTime, endTime }` for overlap.  
  `{ pharmacyId }` for filtering.

- **Pharmacist Schema**:  
  Unique `email` + `licenseNumber`.

---

✅ Day 5 complete:

- Apply to shift
- Conflict detection
- Show applicants
- Pharmacist register/login
- Accept/Reject applications
- DB indexing

# Day 6 – Calendar APIs (Work Log)

## Morning (2 hrs) – Flexible Calendar Endpoint

### Step 1: Decide API Endpoint

- Chose a **single flexible endpoint** instead of separate ones for week/month.
- Endpoint:
  ```http
  GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
  ```
- Frontend controls the date range (day/week/month).

### Step 2: Event Shape

- Each shift transformed into a minimal event object for frontend calendar libraries.
- Structure decided:
  ```json
  {
    "id": "shiftId",
    "title": "Shift at Pharmacy",
    "start": "shift.startTime",
    "end": "shift.endTime",
    "status": "applied/accepted/confirmed/owner"
  }
  ```

### Step 3: Date Validation

- Extracted `start` and `end` from `req.query`.
- Converted to Date objects.
- Validations:
  - Check if both are valid dates.
  - Check if `end >= start`.
  - Return 400 Bad Request for invalid inputs.

### Step 4: Fetching Shifts

- Query only shifts within given range:
  ```javascript
  startTime: { $gte: startDate },
  endTime: { $lte: endDate }
  ```
- Handled separately for Pharmacy and Pharmacist roles.

### Step 5: Role-Based Filtering

**Pharmacy:**

- Only fetch shifts created by that pharmacy (`pharmacyId: req.user.id`).
- Event status = "owner".

**Pharmacist:**

- First fetch applications by that pharmacist.
- Extract all `shiftIds`.
- Find shifts where `_id ∈ shiftIds` AND inside date range.
- Match each shift with its application → set event status = `app.status`.

### Step 6: Format Events

- Used `.map()` to transform DB docs → event objects.
- Preserved `id`, `title`, `start`, `end`.
- Added `status` from role context (owner or application status).

### Step 7: Response

- Return final events array wrapped in ApiResponse:
  ```javascript
  res.json(new ApiResponse(200, events, "Calendar events fetched"));
  ```

## Afternoon (Planned Next)

### Testing:

- With pharmacy role (see only own shifts).
- With pharmacist role (see only applied/accepted/confirmed shifts).
- Different ranges: day, week, month.

### Edge cases:

- No shifts.
- Overlapping shifts.
- Invalid date ranges.

## Progress Today

- Finished endpoint logic, validations, role-based filtering, event transformation.
- Next: Testing with sample data + refining frontend display.

# Day 7 – Advanced Queries & Search System

### **Goal**

Implement a flexible, role-based search system for both pharmacies and pharmacists that allows filtering shifts dynamically through query parameters.

---

### **Morning (2 hrs) – Designing the Search API**

We decided to build a **dedicated Search Router** to separate search logic from other modules (like calendar and shift APIs).  
This helps keep concerns clear and future scaling easier (e.g., adding pagination or sorting later).

## Endpoints added:

        -GET /api/search/pharmacy
        -GET /api/search/pharmacist

Both routes are protected and role-specific, using `authMiddleware` and `requireRole`.

---

### **Pharmacy Search**

**Controller:** `PharmacySearch`

**Purpose:**  
Allow pharmacies to search and filter through **their own posted shifts** using optional filters.

**Filters supported:**

- `city`
- `urgency`
- `shiftType`
- `start` (date)
- `end` (date)

**Implementation details:**

- Built a dynamic query object:
  ```js
  const query = {};
  if (city) query.city = city;
  if (urgency) query.urgency = urgency;
  if (shiftType) query.shiftType = shiftType;
  if (start) query.startTime = { $gte: new Date(start) };
  if (end) query.endTime = { $lte: new Date(end) };
  query.pharmacyId = req.user.id;
  ```
- Fetched all matching shifts from DB with Shift.find(query).

- Returned results wrapped in ApiResponse for consistent formatting.

### If no shifts match → returns a friendly message:

      - "No Shifts found for given filters"

Reasoning:
Pharmacies only need to view and manage their own shifts, so filtering by their pharmacyId ensures data isolation.

## Pharmacist Search

### Controller: PharmacistSearch

#### Purpose:

Allow pharmacists to discover available shifts based on location, urgency, type, or date — while clearly showing which ones they’ve already applied to.

#### Logic flow:

1. Default filter added: query.status = "open".

2. Applied same dynamic filters (city, urgency, shiftType, start, end).

3. Retrieved all Application documents for logged-in pharmacist:

   ```javascript
   const apps = await Application.find({ pharmacistId: req.user.id }).select(
     "shiftId"
   );
   const appliedShiftIds = apps.map((app) => app.shiftId.toString());
   ```

4. Fetched all shifts using built query.

5. Mapped shifts to a new array, adding isApplied field:

   ```javascript
   const resultShifts = shiftsFound.map((shift) => ({
     ...shift._doc,
     isApplied: appliedShiftIds.includes(shift._id.toString()),
   }));
   ```

6. Returned structured response:

   ```javascript
   return res.json(
     new ApiResponse(200, resultShifts, "Shifts fetch for pharmacist")
   );
   ```

### Reasoning:

Pharmacists should easily identify which shifts they’ve already applied for.
The isApplied field enables the frontend to disable or gray out “Apply” buttons for those shifts.

### Integration

Routes defined in SearchRouter.js:

```javascript
SearchRouter.get(
  "/pharmacy",
  authMiddleware,
  requireRole("pharmacy"),
  PharmacySearch
);
SearchRouter.get(
  "/pharmacist",
  authMiddleware,
  requireRole("pharmacist"),
  PharmacistSearch
);
```

## Testing Plan (Deferred to Day 8)

- Verify correct filtering for both roles.

- Ensure isApplied behaves correctly.

- Test partial and empty filters.

- Add fallback defaults (like showing open or city-based shifts when filters are missing).

## Outcome

✅ Implemented full search system with dynamic filtering.
✅ Clean, modular architecture.
✅ Role-based logic and secure access.
✅ Added computed field (isApplied) for better UX.

## Next Steps (Day 8)

- Postman testing of all filters.

- Add default behavior for empty filters.

- Optional: Pagination or sorting for scalability.

## Progress

- Backend completion: ~85% of Day 7
- Focus achieved: Query building, filtering logic, and role-based responses.

## Search API Testing (Pharmacy & Pharmacist)

## 1. Pharmacist Search Endpoint

**Test:** Logged in as pharmacist, hit `/api/search/pharmacist` with no filters.

**Response:**

```json
[
  {
    "_id": "68dbea1d8e6e7538985a53ce",
    "status": "open",
    "isApplied": false
  },
  {
    "_id": "68f1c8d34032fccddc917b25",
    "status": "open",
    "isApplied": true
  },
  {
    "_id": "68f1ca374032fccddc917b2c",
    "status": "open",
    "isApplied": false
  }
]
```

### Observations:

- All open shifts returned by default.

- isApplied correctly reflects applied shifts for the logged-in pharmacist.

- Filters (city, urgency, shiftType, date range) work as expected when applied.

## 2. Pharmacy Search Endpoint

**Test**: Logged in as pharmacy, hit /api/search/pharmacy with no filters.

**FOR** :

```POSTMAN
http://localhost:8000/api/search/pharmacy?start=2025-10-21
```

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "68f1ca374032fccddc917b2c",
      "pharmacyId": "68f1c70bb38c89b7dcc8080b",
      "date": "2025-10-21T00:00:00.000Z",
      "startTime": "2025-10-21T03:00:00.000Z",
      "endTime": "2025-10-21T09:00:00.000Z",
      "hourlyRate": 40,
      "status": "open",
      "requirements": "Licensed pharmacist required 49,2",
      "description": "Morning shift, regular workload,yeah2",
      "urgency": "normal",
      "shiftType": "regular",
      "maxApplicants": 2,
      "applications": [],
      "confirmedPharmacistId": null,
      "city": "Lahore",
      "createdAt": "2025-10-17T04:46:47.399Z",
      "updatedAt": "2025-10-17T04:46:47.399Z",
      "__v": 0
    }
  ],
  "message": "Shifts Returned succesfully with filters applied",
  "success": true,
  "timestamp": "2025-10-17T05:46:19.462Z"
}
```

### Observations:

- Shows all shifts posted by the pharmacy.

- Applications array correctly lists pharmacist applications.

- Filtering by city, urgency, shiftType works correctly.

### Conclusion

- Both endpoints function correctly with default and filtered queries.

- isApplied and applications mapping works as expected.

- Logs are helpful to track behavior over time; recommended to keep trimmed responses (key fields only).

# Day 8 – Redis & Queue Infrastructure

## Morning (2 hrs) – Redis & BullMQ Setup

### Objective

Introduce asynchronous background job processing using **Redis** and **BullMQ**.

### Redis Setup

- Installed and configured **Redis 7+** inside **WSL2 (Ubuntu)** for full Linux compatibility.
- Verified successful connection between Windows Node.js app and Redis running in WSL2.
- Confirmed working ping response (`PONG`) through `testRedis.js`.

### Conceptual Learning

- **Redis as a message broker**: enables background job handling.
- Understood Redis data structures used in queues (mainly **Lists**).
- Learned Redis persistence types (**RDB** snapshots, **AOF** logs).
- Understood why Redis dropped native Windows support and why WSL2 provides native-like performance.

---

## Midday (1.5 hrs) – BullMQ Fundamentals

### Learning Focus

- Explored BullMQ’s role as the **queue management layer** built on top of Redis.
- Understood the lifecycle of a job:
  - **Queue (Producer)** adds jobs.
  - **Worker (Consumer)** processes jobs asynchronously.
  - **Redis** acts as the shared bridge between them.
- Covered key BullMQ concepts:
  - Job retries, concurrency, and events (`completed`, `failed`).

---

## Afternoon (1.5 hrs) – Hello World Implementation

### Experiment Setup

- Created independent **experiment folder** with:
  - Queue file
  - Worker file
  - Producer test
- Implemented and successfully ran **Hello World job** where:
  - Producer added a test job (`sendEmail` mock).
  - Worker picked it up, processed it, and completed it successfully.
- Fixed BullMQ configuration issue (`maxRetriesPerRequest` required to be `null`).
- Verified clean job flow in logs:
  - Job added → processed → completed ✅

### Results

- Redis + BullMQ now working end-to-end.
- Confirmed that Windows app communicates seamlessly with WSL2 Redis instance using `127.0.0.1`.

---

## Key Learnings

- **Redis 7+ on WSL2** = true Linux performance inside Windows.
- **BullMQ** simplifies queue management while leveraging Redis under the hood.
- Separation of concerns:
  - API publishes jobs.
  - Worker consumes them asynchronously.
- Redis connection tuning parameters (`maxRetriesPerRequest`, `enableReadyCheck`) required for BullMQ compatibility.
- Practical understanding of job queues, workers, and async task design in Node.js.

---

## Day Outcome

✅ Redis + BullMQ Hello World experiment successfully executed.  
✅ Redis and Node app communication verified.  
✅ Infrastructure foundation complete for async background jobs.  
➡️ Ready for **Day 9: Email Notification System**, where real email tasks will be integrated into the queue.

# Day 9 – Email Notification System (Async + BullMQ + Nodemailer)

## Morning (2 hrs) – Asynchronous Email Architecture

### Objective

Implement a **background email notification system** using **Redis**, **BullMQ**, and **Nodemailer** so that when a pharmacist applies for a shift, the pharmacy receives an email without blocking the API response.

### Setup & Integration

- Verified **Redis 7+** setup inside WSL2 and ensured connectivity between Node.js and Redis.
- Confirmed `Redis client ready` logs in console to verify stable connection.
- Introduced **BullMQ** queue and worker structure for managing background email jobs.
- Created `emailQueue` to act as the **Producer**, responsible for enqueueing jobs.
- Implemented a **Worker** process that listens to `emailQueue` and processes jobs asynchronously using Redis.

### Result

Successfully established a working connection between BullMQ and Redis, preparing the foundation for async email processing.

---

## Midday (2 hrs) – Email Utility and HTML Template

### Implementation

- Integrated **Nodemailer** with **Ethereal** for local email testing.
- Created an email utility that sends formatted HTML emails to simulate real-world notifications.
- Implemented a reusable email template generator to create structured messages containing:
  - Pharmacist name and license number.
  - Shift date and notes.
  - Pharmacy dashboard link placeholder.
- Ensured consistent styling and branding within the email body.

### Verification

- Verified SMTP connection through `transporter.verify()`.
- Observed successful logs confirming that Nodemailer could connect and send emails using the generated Ethereal test account.

---

## Afternoon (2 hrs) – Controller Integration and End-to-End Test

### ApplyToShift Integration

- Updated **ApplyToShift controller** to trigger an email job whenever a pharmacist applies to a shift.
- System flow:
  1. Pharmacist applies → Application document created.
  2. Shift’s `applications` array updated.
  3. Pharmacy and Pharmacist info fetched.
  4. Email body generated using the template utility.
  5. Email job added to BullMQ queue for asynchronous processing.

### Testing & Validation

- Ran both server and worker simultaneously (`npm run dev` + `npm run worker:email`).
- Observed full log sequence:
  - `Redis client ready`
  - `Job added to queue`
  - `Email job processed successfully`
- Verified Ethereal preview URL in browser — HTML email rendered correctly.

---

## Evening (1 hr) – Final Checks & Observations

### Results

- Queue-based email notification system now fully functional.
- Emails sent asynchronously without delaying API responses.
- Redis manages retries and guarantees reliable job delivery.
- Verified that the ApplyToShift endpoint now triggers real background email notifications end-to-end.

---

## Key Learnings

- **Redis** acts as the communication backbone for job management.
- **BullMQ** simplifies asynchronous processing with reliable retry logic.
- **Nodemailer (Ethereal)** provides realistic local testing before production migration.
- Clean separation of responsibilities between:
  - API → Publishes job
  - Worker → Consumes and executes job
  - Redis → Bridges both reliably

---

## Day Outcome

✅ Email queue, worker, and utility implemented successfully.  
✅ End-to-end workflow validated via Ethereal.  
✅ Controller integrated with background job system.  
🚀 Fully asynchronous, production-ready notification architecture completed.

# 🧩 Pre–Day 10 Development Log

### Step 1 – Add `requiresPharmacistConfirmation` Flag

---

### Overview

Introduced a new boolean field in the **Shift** model to control whether a pharmacist must confirm a pharmacy’s offer before a shift becomes final.  
This addition lays the foundation for supporting both confirmation-required and instant-booking workflows in the system.

---

### Completed Tasks

#### 1.1 – Added Field to Shift Model

- Added `requiresPharmacistConfirmation` field to the `Shift` schema.
- Default value set to `true`.
- Purpose: Define shift behavior mode (confirmation required vs instant booking).

#### 1.2 – Verified Default Behavior

- Created a new shift through the API without including the field.
- Confirmed the flag automatically defaults to `true` and appears in the response.
- Ensured Redis setup did not interfere with core operations.

#### 1.3 – Added Validation

- Updated Joi schema to include `requiresPharmacistConfirmation` as a boolean with default `true`.
- Keeps input clean and ensures backend consistency with model defaults.

#### 1.4 – Controller Adjustments

- Confirmed that `CreateShift` controller already supports the new field automatically via `...rest` spread.
- Decided that pharmacies **cannot update** this flag after shift creation.
- Added logic in `UpdateShift` controller to ignore any incoming attempts to modify this field.
- Final rule: _“This field is immutable after creation.”_

---

### Summary of Current Behavior

- When pharmacy creates a shift, flag defaults to `true` unless explicitly set to `false`.
- Pharmacists will later see this flag when viewing available shifts for clarity.
- Any update attempts on this field are silently ignored.
- Design principle established: the flag defines workflow type and cannot be changed later.

---

### Current Progress

Step 1 completed up to Task 1.4  
Next up → Task 1.5 (Migration for existing shifts).

### 🧩 Task 1.5 – Migration for Existing Shifts

---

#### Overview

After introducing the new `requiresPharmacistConfirmation` field in the **Shift** model, older documents in the database would not automatically contain this property.  
A migration process ensures that all existing shifts are updated to include the field and align with the new system behavior.

---

#### Purpose

- Maintain consistency across all existing and future shift documents.
- Prevent logic errors in later steps that depend on this flag.
- Keep production data backward compatible with the updated model.

---

#### Migration Approach

In production, a one-time migration script or MongoDB command would be executed to find all shifts missing the field and set its value to `true`.  
This operation is **idempotent** — running it multiple times is safe because it o

### 🧩 Task 1.6 – Expose Flag in GET Endpoints (Continued)

---

#### Additional Route Design Decision

Reviewed the `/api/shifts` route configuration to determine proper access and filtering behavior.

- The endpoint `GET /api/shifts` serves as the **public listing** of all available shifts.
- Pharmacies already have a protected route `GET /api/shifts/myShifts` for managing their own postings.
- Therefore, `GET /api/shifts` remains **unauthenticated** (no `authMiddleware`), allowing pharmacists or guests to browse open shifts.

#### Enhancement for Data Integrity

Added a default filter `{ status: "open" }` in the `GetAllShifts` controller to ensure that:

- Only **active and available** shifts are returned.
- Cancelled or filled shifts are hidden from the public list.
- Prevents confusion and preserves expected UX consistency.

#### Outcome

The flag `requiresPharmacistConfirmation` now appears correctly in all relevant GET endpoints, and public access is limited to open shifts only.  
Shift visibility and role-based data boundaries are now well-defined and enforced.

### 🧩 Task 1.7 – Verify Default Behavior of `requiresPharmacistConfirmation`

---

#### Overview

Tested the default value of the new field `requiresPharmacistConfirmation` to confirm that it behaves as expected when omitted during shift creation.

---

#### Procedure

- Created a new shift via the **POST /api/shifts/create** endpoint.
- The request body **did not include** the `requiresPharmacistConfirmation` field.
- Observed both the API response and stored document in MongoDB.

---

#### Observations

- The API response included `"requiresPharmacistConfirmation": true`.
- This confirmed that Mongoose correctly applied the schema default.
- No explicit logic was required in the controller or validation layers.
- The system now guarantees consistent default behavior for all future shift creations.

---

#### Outcome

- ✅ Verified that the field automatically defaults to `true` when omitted.
- ✅ No unintended side effects or missing fields.
- ✅ Default behavior stable across model, validation, and controller layers.

---

**Step 1 – Add `requiresPharmacistConfirmation` Flag**  
All subtasks (1.1–1.7) successfully completed and validated.  
Next stage → **Step 2: Update ApplyToShift logic (handle overlap + smart blocking).**

# 🧩 Pre–Day 10 Development Log

## Step 2 – Update ApplyToShift Logic (Handle Overlap + Smart Blocking)

---

### Overview

This step focused on refining the **ApplyToShift** controller to handle complex overlap scenarios between pharmacist shift applications.  
We introduced smarter business logic that respects the new `requiresPharmacistConfirmation` flag to avoid conflicts between **instant-book (Type B)** and **confirmation-based (Type A)** shifts.

---

## ✅ 2.1 – Preliminary Review of Existing Apply Logic

- Reviewed current implementation to understand base flow:
  - Verifies shift existence and openness.
  - Ensures pharmacist has not already applied.
  - Creates a new application and links it to the shift.
  - Sends an email notification via BullMQ queue.
- Identified missing conflict prevention logic for overlapping shifts.

---

## ✅ 2.2 – Define Business Rules for Overlapping Applications

Established clear behavioral rules governing overlap conditions between existing and new shift applications:

| Case       | Allow Apply? | Reason                                                   |
| ---------- | ------------ | -------------------------------------------------------- |
| **A ↔ A** | ✅ Allowed   | Pharmacist can later choose; confirmation required.      |
| **A ↔ B** | ✅ Allowed   | Pharmacist can decline A if accepted for auto-confirm B. |
| **B ↔ A** | ✅ Allowed   | No conflict; B is firm but A can still be withdrawn.     |
| **B ↔ B** | ❌ Block     | Prevents double-booking with no opt-out option.          |

- These rules ensure flexibility while maintaining platform trust and preventing schedule collisions.
- Discussed atomicity concerns — concluded that **B↔B overlaps** are the only truly dangerous case.

---

## ✅ 2.3 – Implemented Smart Overlap Detection in ApplyToShift

- Added query to fetch all **active applications** (`applied`, `offered`, `accepted`) for the pharmacist.
- Populated each with its corresponding `shiftId` for access to time ranges and flag data.
- Introduced loop to detect overlapping shifts based on time window comparison:
  - `ShiftFound.startTime < existingShift.endTime && ShiftFound.endTime > existingShift.startTime`
  - If both shifts are **Type B (auto-confirm)** → block application and return conflict details.
  - All other combinations allowed as per rule table above.
- Preserved previous validations, email queue, and DB consistency steps.

---

### Outcome

- The **ApplyToShift** controller now intelligently blocks only unsafe overlap scenarios.
- Pharmacists can safely apply to multiple shifts with predictable and fair restrictions.
- Error responses clearly indicate conflicting shift IDs when a block occurs.
- This completes **Step 2.3** of the pre–Day 10 logic refactor.

---

**Next Step → Step 2.4: Auto-withdraw overlapping A-type applications when B-type is accepted.**

## ✅ Step 2.4 – Auto-Withdraw Overlapping A-Type Applications When B-Type is Accepted

## Overview

Once a **Type B (auto-confirm)** application is accepted, any overlapping **Type A applications** for the same pharmacist should be **automatically withdrawn**.  
This prevents scheduling conflicts while allowing pharmacists to maintain control over Type A shifts if no conflicts exist.

---

## Implementation Highlights

- Fetch all **active applications** (`applied`, `offered`, `accepted`) for the pharmacist.
- Identify overlaps using the time window:

```js
shift.startTime < otherShift.endTime && shift.endTime > otherShift.startTime;
```

- Only overlapping applications are targeted.
- Overlapping Type A applications are updated with:

```js
status = "withdrawn";
```

- Type B application is accepted and shift is marked `filled`.
- Other applications for the same shift are `rejected`.
- **Atomicity considerations**: updates occur in sequence; optionally could be wrapped in a MongoDB transaction for full safety.

---

## ✅ Step 2.5 – Confirm Correct Application Creation Behavior Per Shift Type

## ✅ Overview

Ensures that application and shift statuses correctly reflect Type A vs Type B rules:

| Shift Type | Application Status | Shift Status | Notes                                                            |
| ---------- | ------------------ | ------------ | ---------------------------------------------------------------- |
| Type B     | `accepted`         | `filled`     | Overlapping A applications withdrawn; other applicants rejected. |
| Type A     | `offered`          | `open`       | Pharmacist manually confirms; other applicants untouched.        |

- Guarantees consistent backend behavior.
- Status updates match business logic and frontend expectations.

---

## ✅Step 2.6 – Test Scenarios (Deferred)

## Overview

Step 2.6 is dedicated to testing all scenarios to verify correctness:

### Type B Acceptance:

- Shift marked `filled`.
- Other applications `rejected`.
- Overlapping A applications `withdrawn`.

### Type A Offer:

- Application marked `offered`.
- Shift remains `open`.
- No interference with other applications.

### Overlap Handling:

- Pharmacist cannot accidentally double-book for auto-confirm shifts.
- Manual confirmation shifts remain flexible.

### Edge Cases:

- Missing or invalid shift/application IDs.
- Unauthorized access.
- Already filled shifts.

**Note**: Actual testing is deferred until all pre-Day 10 steps are complete. Logs, Postman, or automated tests can verify the full workflow.
Step 2.6 is dedicated to **testing all scenarios** to verify correctness:

- Type B acceptance:
  - Shift marked `filled`.
  - Other applications rejected.
  - Overlapping A applications withdrawn.
- Type A offer:
  - Application marked `offered`.
  - Shift remains open.
  - No interference with other applications.
- Overlap handling:
  - Pharmacist cannot accidentally double-book for auto-confirm shifts.
  - Manual confirmation shifts remain flexible.
- Edge cases:
  - Missing or invalid shift/application IDs.
  - Unauthorized access.
  - Already filled shifts.

> ⚠️ **NOTE:**
>
> - **Type A**: _Pharmacist confirmation required_ — pharmacist must manually accept the shift; shift is not auto-filled.
> - **Type B**: _Auto-confirm / instant booking_ — shift is immediately accepted upon pharmacy approval; no pharmacist confirmation is needed.

> **Testing is deferred** until all pre-Day 10 steps are complete. Logs, Postman, or automated tests can verify the full workflow.

---

## ✅ Step 3 – Implement Pharmacist Response Endpoints (Confirm / Reject Offers)

### Overview

Added pharmacist-side endpoints to allow confirming or rejecting Type A offers manually.

| Action        | Endpoint                                            | Outcome                                                                                                                                                                |
| ------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirm Offer | `POST /api/pharmacist/confirm-offer/:applicationId` | Marks application as **accepted**, shift as **filled**, rejects other applicants for the same shift, and withdraws overlapping active applications of that pharmacist. |
| Reject Offer  | `POST /api/pharmacist/reject-offer/:applicationId`  | Marks application as **rejected**, leaves shift **open**, and does not affect other applicants.                                                                        |

### Safeguards

- Pharmacist can only confirm or reject **their own** applications (`403 Forbidden` otherwise).
- Confirm endpoint validates that application status = `offered` — pharmacists cannot self-accept unoffered shifts.
- Atomic updates ensure all related records (shift + other apps) remain consistent.

---

## ✅ Step 4 – Implement Un-Apply / Reverse Apply (Switch Shift)

### Overview

Added endpoints so pharmacists can withdraw or switch their applications before confirmation.

| Action       | Endpoint                                        | Key Behavior                                                                                    |
| ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Un-Apply     | `DELETE /api/pharmacist/unapply/:applicationId` | Withdraws the application (status → `withdrawn`) unless it’s an already-accepted Type B.        |
| Switch Shift | `POST /api/pharmacist/switch`                   | Allows pharmacist to withdraw an overlapping app and apply to another shift in one atomic step. |

### Validations

- Pharmacists can only withdraw their own applications.
- Cannot withdraw Type B applications once accepted (`400 Bad Request`).
- Withdrawn apps are reusable on re-apply (handled via `$nin` status filter).

---

## ✅ Step 5 – Final Testing & Verification

### Postman / Manual Testing

All real-world flows tested and validated:

1. **Registration + Login** for both roles.
2. **Type A flow** — Apply → Offer → Confirm / Reject.
3. **Type B flow** — Auto-confirm + withdraw restriction.
4. **Withdraw / Re-apply logic** — confirmed working.
5. **Overlap rules** — only B↔B blocked; others allowed.
6. **Unauthorized access attempts** — properly return 403.

### Outcome

All controllers, routes, and DB states behave as expected.  
This concludes all **Pre-Day 10 implementation**; the system is now stable and ready for:

> **Day 10 → Async Conflict Worker (Redis/BullMQ)**  
> Automates overlap checks and asynchronous withdrawals.

---
