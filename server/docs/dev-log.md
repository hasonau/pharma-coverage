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
