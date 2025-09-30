import { authMiddleware } from "../middlewares/Auth.middleware.js"
import { ApiError } from "../utils/ApiError.js";
import Shift from "../models/Shift.model.js"
import Application from "../models/Application.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const ApplyToShift = async (req, res, next) => {
    // we do all the work here
    //#region Checking before creation of anything in DB
    const { notes } = req.body;
    const { id } = req.user;
    const shiftId = req.params.shiftId;
    const ShiftFound = await Shift.findById(shiftId)
    if (!ShiftFound) return next(new ApiError(404, "This shiftID doesn't exist in SHIFT Model"))
    if (ShiftFound.status !== "open") return next(new ApiError(404, "Shift is not open" || "Shift has been closed"))
    const applicationFound = await Application.findOne({
        shiftId: shiftId,
        pharmacistId: id
    });

    if (applicationFound) return next(new ApiError(404, "Already applied"))
    //#endregion

    // {
    //   "email": "healthy@example.com",
    //   "password": "SecurePass123"
    // // }
    // #region creation and response
    const applicationCreated = await Application.create(
        {
            pharmacistId: req.user.id,
            shiftId: shiftId,
            notes: notes
        }
    )
    ShiftFound.applications.push(applicationCreated._id);
    await ShiftFound.save();

    res.json(new ApiResponse(200, applicationCreated, "Application Done,applied to the shift"))
    //#endregion
}

export { ApplyToShift };