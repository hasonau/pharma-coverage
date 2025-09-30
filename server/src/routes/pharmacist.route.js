import express from 'express';
import { ApplyToShift } from "../controllers/Pharmacist.controller.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";

const PharmacistRouter = express.Router();


PharmacistRouter.post("/apply/:shiftId", requireRole("pharmacist"), ApplyToShift);


export { PharmacistRouter };