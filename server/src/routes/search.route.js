import express from "express"
import { PharmacySearch } from "../controllers/Search.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"


const SearchRouter = express.Router()


SearchRouter.get("/pharmacy", authMiddleware, PharmacySearch);
SearchRouter.get("/pharmacist")



export { SearchRouter };