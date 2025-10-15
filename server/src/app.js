import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js"; // adjust path if needed
import { PharmacyRouter } from "./routes/pharmacy.route.js"
import { ShiftRouter } from "./routes/shift.route.js"
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PharmacistRouter } from "./routes/pharmacist.route.js";
import { SearchRouter } from "./routes/search.route.js";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again later."
});

const app = express()

//#region CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
//#endregion

//#region  MIDDLEWARES BEFORE ROUTES
app.use(limiter);
app.use(helmet());
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())
//#endregion

//#region My website APIENDPOINTS
app.use("/api/pharmacy/", PharmacyRouter)
app.use("/api/shifts/", ShiftRouter)
app.use("/api/pharmacist/", PharmacistRouter); // Pharmacist routes
app.use("/api/search/", SearchRouter);

//#endregion

//#region GLOBAL ERROR
app.use((err, req, res, next) => {
    // If it's our custom ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
            timestamp: new Date().toISOString(),
        });
    }

    // Otherwise, log unexpected error
    console.error("Unexpected Error:", err);

    // Send generic fallback
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        timestamp: new Date().toISOString(),
    });
});
//#endregion


export { app }