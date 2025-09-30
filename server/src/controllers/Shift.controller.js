import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Shift from "../models/Shift.model.js";

const CreateShift = async (req, res, next) => {
    try {
        const data = req.body;
        const pharmacyId = req.user.id;

        const newShift = await Shift.create({ ...data, pharmacyId });

        res.json(
            new ApiResponse(201, newShift, "New Shift Created Successfully,in DB")
        );
    } catch (error) {
        // Mongo duplicate key error (from compound index: date + startTime + endTime)
        if (error.code === 11000) {
            return next(new ApiError(400, "Shift already exists for this date and time"));
        }
        next(error); // let global handler deal with anything else
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

export { CreateShift, GetPharmacyShifts, GetAllShifts, UpdateShift, DeleteShift };
