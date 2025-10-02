import express from "express"
import { Login, RegisterPharmacy, AcceptApplication, RejectApplication } from "../controllers/Pharmacy.controller.js"
import { authMiddleware } from "../middlewares/Auth.middleware.js"
import { LoginPharmacySchema, RegisterPharmacySchema } from "../validations/pharmacy.validation.js"
import { validate } from "../middlewares/validate.js"


const PharmacyRouter = express.Router()

PharmacyRouter.post("/login", validate(LoginPharmacySchema), Login)
PharmacyRouter.post("/register", validate(RegisterPharmacySchema), RegisterPharmacy)
PharmacyRouter.get("/protected", authMiddleware, (req, res) => {
    res.json({ success: true, message: "Access granted", user: req.user });
});
PharmacyRouter.post("/applications/:applicationId/accept", authMiddleware, AcceptApplication)
PharmacyRouter.post("/applications/:applicationId/reject", authMiddleware, RejectApplication)


export { PharmacyRouter };