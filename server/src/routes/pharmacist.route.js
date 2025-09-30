import express from 'express';
import { ApplyToShift } from "../controllers/Pharmacist.controller.js";

const router = express.Router();


router.post("/apply:shiftId", requireRole("pharmacist"), ApplyToShift);
