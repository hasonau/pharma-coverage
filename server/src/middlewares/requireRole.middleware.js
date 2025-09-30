import { ApiError } from "../utils/ApiError.js";

const requireRole = (role) => {

    return (req, res, next) => {

        if (!req.user) return next(new ApiError(401, "Authentication required,your role is not valid for this"));

        if (req.user.role.toLowerCase() == role.toLowerCase()) return next();
        next(new ApiError(403, "Forbidden: pharmacy role required"));
    }
}
export { requireRole };