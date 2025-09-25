import express from "express"
import { Login, RegisterPharmacy } from "../controllers/Pharmacy.controller.js"

const PharmacyRouter = express.Router()

PharmacyRouter.post("/Login", Login)
PharmacyRouter.post("/Register", RegisterPharmacy)


export { PharmacyRouter };