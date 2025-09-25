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

- **User models** (`Pharmacy` / `Pharmacist`) with validation and required fields.
- **Password hashing** implemented in models.
- **JWT utilities**: `generateToken` and `verifyToken` for token creation and verification.
- **Cookie helper**: sets JWT in httpOnly, secure cookies.

## Controllers & Routes

- **Register APIs** for pharmacies:
  - Validates required fields.
  - Checks for duplicate emails.
  - Creates a new pharmacy user.
  - Generates JWT token and sets it in cookie.
  - Returns structured response with minimal user info.

- **Login APIs** for pharmacies:
  - Validates email and password.
  - Generates JWT token and sets it in cookie.
  - Returns structured success response.

- **Routes**:
  - `POST /api/pharmacy/Register` → Register pharmacy
  - `POST /api/pharmacy/Login` → Login pharmacy

## Testing & Verification

- Registration and login tested in Postman.
- Cookie set successfully after registration and login.
- Duplicate email registration returns proper error.
- Login works only with correct JSON payload (`email` + `password`).
