import express from "express"
import { PharmacySearch, PharmacistSearch } from "../controllers/Search.controller.js"
import { authMiddleware } from "../middlewares/Auth.middleware.js"
import { requireRole } from "../middlewares/requireRole.middleware.js"


const SearchRouter = express.Router()


SearchRouter.get("/pharmacy", authMiddleware, requireRole("pharmacy"), PharmacySearch);
SearchRouter.get("/pharmacist", authMiddleware, requireRole("pharmacist"), PharmacistSearch);



export { SearchRouter };