import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "3m";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
}

/**
 * Generate a signed JWT.
 * payload example: { id: user._id, role: user.role }
 */
export function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify token — returns decoded payload if valid, throws if not.
 */
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
