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

# DAY 5 – Application System & Conflict Algorithm

## Morning (2 hrs)

### Apply to Shift API

- Implemented **ApplyToShift controller**:
  - Extracts `pharmacistId` from `req.user.id` (token).
  - Extracts `shiftId` from `req.params.shiftId`.
  - Optional `notes` from request body.
  - Validates:
    - Shift exists.
    - Shift is `open`.
    - Pharmacist hasn’t already applied to this shift.
  - Creates a new `Application` document with:
    - `pharmacistId`
    - `shiftId`
    - `notes` (if provided)
    - `status` defaults to `"applied"`.
  - Updates the `Shift` document:
    - Pushes the new `application._id` into the `applications` array.
    - Saves updated shift.
  - Returns structured `ApiResponse` with success message and application details.

**Endpoint:**  
`POST /api/pharmacist/apply/:shiftId`  
**Auth:** Required (Pharmacist only)

**Request Body Example:**

```json
{
  "notes": "I am available and experienced with weekend shifts."
}
```

## Conflict Detection for Shifts

We added logic to prevent pharmacies from creating **overlapping shifts** on the same day.

### Validations Performed

- All provided fields (`date`, `startTime`, `endTime`) must be valid dates.
- `startTime < endTime`.
- If `date` is **today**:
  - `startTime` must be later than the current system time.
  - (Optional small margin allowed, e.g. 2–3 minutes).
- `date`, `startTime`, and `endTime` must all belong to the **same calendar day**.
- Before saving a shift, check if another shift for the **same pharmacy** overlaps with the requested time.

### Overlap Rule

A new shift **overlaps** if:

- Its `startTime` is before an existing shift’s `endTime`, **AND**
- Its `endTime` is after an existing shift’s `startTime`.

#### Example

- Existing shift: `09:00 – 12:00`
- New attempt:
  - `11:30 – 14:00` → ❌ Overlaps (11:30–12:00) → rejected
  - `12:00 – 15:00` → ✅ No overlap → allowed

---

### Query for Overlap Detection

We implemented an overlap check during shift creation:

```js
const overlapShift = await Shift.findOne({
  pharmacyId,
  date: shiftDate,
  $or: [
    {
      startTime: { $lt: end },
      endTime: { $gt: start },
    },
  ],
});
```

## ShowApplicants API – List Applications

**Endpoint:**  
`GET /shifts/:shiftId/applicants`

**Purpose:**  
Allow a pharmacy to view all applicants for a specific shift they posted.

**Workflow:**

1. **Frontend:**
   - Pharmacy clicks "View Applicants" button on their posted shifts.
   - Sends `shiftId` in URL to backend.

2. **Backend:**
   - Extract `shiftId` from `req.params` and pharmacy ID from `req.user.id`.
   - Query the Shift collection:

```javascript
const shiftWithApplicants = await Shift.findById(shiftId).populate({
  path: "applications",
  populate: { path: "pharmacistId", select: "name email" },
});
```

### ShowApplicants API – Summary

- **Purpose:** Allows a pharmacy to view all applicants for a specific shift they posted.

- **Workflow:**
  - Fetch the shift document using its ID.
  - Populate each applicant’s pharmacist information (name and email).
  - Perform an authorization check to ensure the requesting pharmacy owns the shift.
  - If unauthorized, return a `403` error.
  - If the shift does not exist or is not owned by the pharmacy, return a `404` error.

- **Response Example:**
  - Includes shift details (`_id`, `date`, `startTime`, `endTime`) and an array of applications.
  - Each application contains the pharmacist's name, email, and application status.

- **Notes:**
  - Frontend should only show "View Applicants" for shifts posted by the logged-in pharmacy.
  - Backend authorization ensures security and prevents unauthorized access.
  - Optimization: fetch and authorization can be combined in a single query to reduce operations.

## (Forgot making in previous days) Pharmacist Authentication (Register & Login)

### Register Pharmacist

**Endpoint:**  
`POST /pharmacist/register`

**Description:**  
Allows a new pharmacist to create an account. On successful registration, a JWT token is generated and set in an HTTP-only cookie, so the pharmacist is logged in immediately.

**Flow:**

- Validates request body with Joi schema.
- Checks if email already exists.
- Checks if license number already exists.
- Creates new pharmacist (password is hashed automatically).
- Issues JWT token `{ id, role: "pharmacist" }` and stores in cookies.
- Returns pharmacist’s basic info (name + email).

**Note:**  
Response can be viewed in Postman upon hitting this endpoint.

---

### Login Pharmacist

**Endpoint:**  
`POST /pharmacist/login`

**Description:**  
Authenticates pharmacist with email and password. On success, a JWT token is generated and set in an HTTP-only cookie.

**Flow:**

- Validates request body with Joi schema.
- Looks up pharmacist by email.
- Verifies password using bcrypt compare.
- Issues JWT token `{ id, role: "pharmacist" }` and stores in cookies.
- Returns pharmacist’s email.

**Note:**  
Response can be viewed in Postman upon hitting this endpoint.
