import express from "express";
import { authMiddleware } from "../middlewares/Auth.middleware.js"
import { requireRole } from "../middlewares/requireRole.middleware.js"
import { CreateShiftSchema, UpdateShiftSchema } from "../validations/shift.validation.js"
import { validate } from "../middlewares/validate.js"
import { CreateShift, GetAllShifts, GetPharmacyShifts, UpdateShift, DeleteShift, ShowApplicants, RangeShifts } from "../controllers/Shift.controller.js"

const ShiftRouter = express.Router();

ShiftRouter.post("/create", authMiddleware, requireRole("Pharmacy"), validate(CreateShiftSchema), CreateShift)
ShiftRouter.get("/myShifts", authMiddleware, requireRole("Pharmacy"), GetPharmacyShifts)
ShiftRouter.get("/", GetAllShifts)
ShiftRouter.put("/:id", authMiddleware, requireRole("Pharmacy"), validate(UpdateShiftSchema), UpdateShift);
ShiftRouter.delete("/:id", authMiddleware, requireRole("Pharmacy"), DeleteShift);
ShiftRouter.get("/:shiftId/applications", authMiddleware, requireRole("Pharmacy"), ShowApplicants);
export { ShiftRouter };
ShiftRouter.get("/calendar", authMiddleware, RangeShifts)