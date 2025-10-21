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
