import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js"; // adjust path if needed

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//routes import

//routes declaration





// This should be at the very end, after routes
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


export { app }