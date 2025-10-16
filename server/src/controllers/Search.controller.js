import Shift from "../models/Shift.model";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const PharmacySearch = async (req, res, next) => {
    // here goes the logic now,
    // we need to find out the filters first,we need to get those filters somehow and save them in filter obejct,idk how we get those from url,maybe using req.params,but that is not correct,ma;ybe some other way,whatever,we do,we get filters,and then we tryna build a query using them,hmm,and then send or hit DB,and get data,right
    const query = {};
    const { city, urgency, shiftType, start, end } = req.query;
    if (city) query.city = city;
    if (urgency) query.urgency = urgency;
    if (shiftType) query.shiftType = shiftType;
    if (start) query.startTime = { $gte: new Date(start) }
    if (end) query.endTime = { $lte: new Date(end) };

    query.pharmacyId = req.user.id;

    const shiftsFound = await Shift.find(query);
    if (shiftsFound.length === 0) return res.json(new ApiResponse(200, [], "No shifts found for given filters"));


    res.json(new ApiResponse(200, shiftsFound, "Shifts Returned succesfully with filters applied"))

    // if req.query.city then add it to object otherwise not
    // same goes for next ones,other filters right,i dk how to do that,but will learn with ur help

}
const PharmacistSearch = async (req, res, next) => {
    const query = {};
    const { city, urgency, shiftType, start, end } = req.query
    query.status = "open"
    if (city) query.city = { $regex: city, $options: "i" }
    if (urgency) query.urgency = urgency
    if (shiftType) query.shiftType = shiftType
    if (start) query.startTime = { $gte: new Date(start) }
    if (end) query.endTime = { $lte: new Date(end) }

    // logged-in pharmacist's all Applicatoins
    const apps = await Application.find({ pharmacistId: req.user.id }).select("shiftId");
    const appliedShiftIds = apps.map(app => app.shiftId.toString());
    console.log("length of appliedshifts :", appliedShiftIds.length);

    const shiftsFound = await Shift.find(query);
    const resultShifts = shiftsFound.map(shift => ({
        ...shift._doc,
        isApplied: appliedShiftIds.includes(shift._id.toString())
    }));
    if (resultShifts.length == 0) return res.json(new ApiResponse(200, [], "No shifts found for given filters"));
    return res.json(new ApiResponse(200, resultShifts, "Shifts fetch for pharmacist"))

}


export { PharmacySearch, PharmacistSearch };
