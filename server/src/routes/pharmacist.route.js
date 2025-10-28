import express from 'express';
import { ApplyToShift, LoginPharmacist, RegisterPharmacist, UnApplyShift, switchShiftApplication } from "../controllers/Pharmacist.controller.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { validate } from "../middlewares/validate.js"
import { RegisterPharmacistSchema, LoginPharmacistSchema } from "../validations/pharmacist.validation.js"
import { authMiddleware } from '../middlewares/Auth.middleware.js';

const PharmacistRouter = express.Router();


PharmacistRouter.post("/apply/:shiftId", authMiddleware, requireRole("pharmacist"), ApplyToShift);
PharmacistRouter.delete("/unapply/:applicationId", authMiddleware, requireRole("pharmacist"), UnApplyShift);
PharmacistRouter.post("/switch", authMiddleware, requireRole("pharmacist"), switchShiftApplication);
PharmacistRouter.post("/register", validate(RegisterPharmacistSchema), RegisterPharmacist);
PharmacistRouter.post("/login", validate(LoginPharmacistSchema), LoginPharmacist);

export { PharmacistRouter };