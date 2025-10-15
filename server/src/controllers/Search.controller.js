import Shift from "../models/Shift.model";
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


export { PharmacySearch };


// 🧠 What You’ve Learned (From Search Feature Work)

// Using query parameters (req.query)

// Learned how frontend sends filters like ?city=Lahore&urgency=high and how to extract them.

// Dynamic query building in MongoDB

// Understood how to build a query object conditionally (if (city) query.city = city), so filters are applied only if provided.

// Date filtering with MongoDB operators

// Learned to use $gte (greater than or equal) and $lte (less than or equal) for date ranges.

// Flexible filtering behavior

// Realized how the query works even if only one of start or end is provided — it still produces correct results.

// Role-aware querying concept

// Noted that pharmacies should see only their own shifts, which means adding pharmacyId: req.user.id later.

// Importance of structured defaults

// Discussed having default filters (like showing city-based or open shifts first) to avoid empty UI.

// Progressive learning mindset

// You intentionally avoided writing full code blocks, focusing on thinking and reasoning first, which solidifies memory of syntax and logic.