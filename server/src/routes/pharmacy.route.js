import express from "express"
import { Login, RegisterPharmacy } from "../controllers/Pharmacy.controller.js"
import { authMiddleware } from "../middlewares/Auth.middleware.js"
const PharmacyRouter = express.Router()

PharmacyRouter.post("/Login", Login)
PharmacyRouter.post("/Register", RegisterPharmacy)
PharmacyRouter.get("/protected", authMiddleware, (req, res) => {
    res.json({ success: true, message: "Access granted", user: req.user });
});


export { PharmacyRouter };