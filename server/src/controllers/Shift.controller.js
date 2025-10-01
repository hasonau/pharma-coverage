import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Shift from "../models/Shift.model.js"

const CreateShift = async (req, res, next) => {
    try {
        const { date, startTime, endTime, ...rest } = req.body;
        const pharmacyId = req.user.id;

        // Convert into Date objects
        const shiftDate = new Date(date);
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        // Validate all inputs are valid dates
        if (isNaN(shiftDate) || isNaN(start) || isNaN(end)) {
            return next(new ApiError(400, "Invalid date or time provided"));
        }

        // Ensure start < end
        if (start >= end) {
            return next(new ApiError(400, "startTime must be before endTime"));
        }

        // Ensure all times are on the same day
        if (
            shiftDate.toDateString() !== start.toDateString() ||
            shiftDate.toDateString() !== end.toDateString()
        ) {
            return next(new ApiError(400, "date, startTime, and endTime must be on the same day"));
        }

        // Disallow past dates
        if (shiftDate < new Date(now.toDateString())) {
            return next(new ApiError(400, "Shift date cannot be in the past"));
        }

        // Special case: if date is today
        if (shiftDate.toDateString() === now.toDateString()) {
            // Add a small margin of 3 minutes
            const minStart = new Date(now.getTime() + 3 * 60000);
            if (start < minStart) {
                return next(new ApiError(400, "Shift must start at least 3 minutes from now"));
            }
        }

        // Overlap check (simplified for now, we’ll extend later)
        const overlap = await Shift.findOne({
            pharmacyId,
            date: shiftDate,
            $or: [
                { startTime: { $lt: end }, endTime: { $gt: start } } // overlap condition
            ]
        });

        if (overlap) {
            return next(new ApiError(400, "Shift overlaps with an existing shift"));
        }

        // Create new shift
        const newShift = await Shift.create({
            pharmacyId,
            date: shiftDate,
            startTime: start,
            endTime: end,
            ...rest
        });

        res.json(new ApiResponse(201, newShift, "New Shift Created Successfully,in DB"));

    } catch (error) {
        next(error);
    }
};

const GetPharmacyShifts = async (req, res, next) => {
    try {
        const data = await Shift.find({ pharmacyId: req.user.id })
        res.json(new ApiResponse(200, data, "All posted Shifts returned"))
    } catch (error) {
        next(error);
    }
}
const GetAllShifts = async (req, res, next) => {
    try {
        const { date, shiftType, urgency, status } = req.query;
        const filter = {};
        if (date) filter.date = date;            // only add if date exists
        if (shiftType) filter.shiftType = shiftType; // only add if shiftType exists
        if (urgency) filter.urgency = urgency;
        if (status) filter.status = status;


        const data = await Shift.find(filter);
        res.json(new ApiResponse(200, data, "All Shifts returned"))
    } catch (error) {
        next(error);
    }
}
const UpdateShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pharmacyId = req.user.id;
        const updateData = req.body;

        // Find the shift owned by this pharmacy
        const shift = await Shift.findOne({ _id: id, pharmacyId });
        if (!shift) {
            return next(new ApiError(404, "Shift not found or not yours to update"));
        }

        // Update allowed fields
        Object.assign(shift, updateData);
        await shift.save();

        res.json(new ApiResponse(200, shift, "Shift updated successfully"));
    } catch (error) {
        // Handle duplicate key error if needed
        if (error.code === 11000) {
            return next(new ApiError(400, "Shift already exists for this date and time"));
        }
        next(error);
    }
};
const DeleteShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pharmacyId = req.user.id;

        const shift = await Shift.findOneAndDelete({ _id: id, pharmacyId });
        if (!shift) {
            return next(new ApiError(404, "Shift not found or not yours to delete"));
        }

        res.json(new ApiResponse(200, shift, "Shift deleted successfully"));
    } catch (error) {
        next(error);
    }
};
const ShowApplicants = async (req, res, next) => {
    try {
        const { shiftId } = req.params;
        const pharmacyId = req.user.id;

        // Step 1: Find the shift by ID
        const shiftWithApplicants = await Shift.findById(shiftId)
            .populate({
                path: "applications",
                populate: { path: "pharmacistId", select: "name email" }
            });

        // Step 2: Check that shift exists AND belongs to this pharmacy
        if (!shiftWithApplicants) {
            return next(new ApiError(404, "Shift not found"));
        }
        if (shiftWithApplicants.pharmacyId.toString() !== pharmacyId) {
            return next(new ApiError(403, "You are not allowed to view applicants for this shift"));
        }


        // (we’ll add population of applications later)
        res.json(new ApiResponse(200, shiftWithApplicants, "Applicants retrieved successfully"));
    } catch (error) {
        next(error);
    }
}
export { CreateShift, GetPharmacyShifts, GetAllShifts, UpdateShift, DeleteShift, ShowApplicants };
