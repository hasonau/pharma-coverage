import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { verifyToken } from "../utils/jwt.js"

const authMiddleware = (req, res, next) => {
    //  we extract token from cookie,and if it's not there,throw error,
    // if found,check it against it's payload things,if it's valid then we just send it to next right

    const token = req.cookies.token
    if (!token) throw new ApiError(401, "Token not provided")

    const isTokenTrue = verifyToken(token);
    if (!isTokenTrue) throw new ApiError(404, "Wrong Token")

    req.user = isTokenTrue;
    next();
}
export { authMiddleware };