import { ApiError } from "../utils/ApiError.js";
import Shift from "../models/Shift.model.js"
import Application from "../models/Application.model.js"
import Pharmacy from '../models/Pharmacy.model.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import Pharmacist from "../models/Pharmacist.model.js"
import { generateToken, verifyToken } from "../utils/jwt.js"
import { setTokeninCookie } from "../utils/cookie.js";
import { emailQueue } from "../queues/emailQueue.js";
import { generateApplicationEmail } from "../utils/generateApplicationEmail.js";

const RegisterPharmacist = async (req, res, next) => {
    try {
        const newPharmacistData = req.body;
        if (!newPharmacistData) throw new ApiError(400, "Request body is required");

        // Check if email already exists
        const alreadyEmailExists = await Pharmacist.findOne({ email: newPharmacistData.email });
        if (alreadyEmailExists) throw new ApiError(400, "Email already exists");

        // Check if licenseNumber already exists
        const alreadyLicenseExists = await Pharmacist.findOne({ licenseNumber: newPharmacistData.licenseNumber });
        if (alreadyLicenseExists) throw new ApiError(400, "License number already exists");

        // Create new Pharmacist
        const newPharmacist = await Pharmacist.create({
            name: newPharmacistData.name,
            email: newPharmacistData.email,
            password: newPharmacistData.password,
            licenseNumber: newPharmacistData.licenseNumber,
            contactNumber: newPharmacistData.contactNumber,
            addressLine: newPharmacistData.addressLine,
            city: newPharmacistData.city,
            state: newPharmacistData.state,
            country: newPharmacistData.country,
            postalCode: newPharmacistData.postalCode,
            specialization: newPharmacistData.specialization,
            experience: newPharmacistData.experience,
            role: "pharmacist"
        });

        // Generate token (payload includes ID + role)
        const payload = { id: newPharmacist._id, role: "pharmacist" };
        const token = generateToken(payload);
        console.log("Token:", token);

        // Set token in cookie
        setTokeninCookie(res, token);

        // Respond
        res.json(new ApiResponse(
            201,
            { name: newPharmacist.name, email: newPharmacist.email },
            "Pharmacist Registration Successful"
        ));

    } catch (error) {
        next(error);
    }
};
const LoginPharmacist = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find pharmacist by email
        const pharmacistFound = await Pharmacist.findOne({ email });
        if (!pharmacistFound) throw new ApiError(404, "Pharmacist not found with this email");

        // Compare password
        const isPasswordCorrect = await pharmacistFound.comparePassword(password);
        if (!isPasswordCorrect) throw new ApiError(401, "Wrong password");

        // Generate token
        const payload = { id: pharmacistFound._id, role: "pharmacist" };
        const token = generateToken(payload);
        console.log("Token:", token);

        // Set token in cookie
        setTokeninCookie(res, token);

        // Respond
        res.json(new ApiResponse(200, { email: pharmacistFound.email }, "Login Successful"));
    } catch (error) {
        next(error);
    }
};


const ApplyToShift = async (req, res, next) => {
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

    if (applicationFound) return next(new ApiError(400, "Already applied"))
    //#region COMMENT
    // before creating application we have to check if the shift requires pharmacist confirmation
    // we check if requiresPharmacistConfirmation is true,it means,we can just move on and create application and save shift and else things,everything remains as it was happening,right,because here we don't need to check conflicts,we are allowing pharmacist to apply to this,without any hesitation
    // but what if requiresPharmacistConfirmation is false,that means,no confirmation from pharmacist if pharmacy accepts,so we set requiresPharmacistConfirmation as false,or maybe wait,in this case,what we do is,we actually check that pharmacist's already applied applicatoins,and see if there is any shift he's applied to that overlaps with this one where he is applying now,because if he has applied for any other shift A with 9-12 timing,and now he is applying for this shift which is 10-12,wait another thing,we can allow pharmacist to apply to overlapping shift as well,because when pharmacist is applying for this shift,if he gets accepted here,and accepted for that other shift of 9-12,now if this 9-12 shift has requiresPharmacistConfirmation true,it means pharmacist can still reject that one,and because he is accepted for this one as well,but we can't allow pharmaicst to apply to a shift which is overlapping as well as whose requiresPharmacistConfirmation is false,then comes the problem that if he gets accepted at both he will not be able to go to both,if requiresPharmacistConfirmation is true and time overlaps,it's fine,because pharmacist can cnacel that first shfit if got accepted for this new shift where he has no option but to come,he should be vigilant that if this 10-12 shift is auto accept,and is paying 10 dollars,and that 9-12 shift is paying 15 dollars,if he gets accepted for both,he will surely have to come to 10 dollars one,because of auto accept of this shift,
    //#endregion
    const activeApplications = await Application.find({
        pharmacistId: id,
        status: { $in: ["applied", "offered", "accepted"] }
    }).populate("shiftId");
    let conflictFound = false;
    let conflictingShiftIds = [];

    for (const app of activeApplications) {
        const existingShift = app.shiftId;
        if (!existingShift) continue;

        const overlaps =
            ShiftFound.startTime < existingShift.endTime &&
            ShiftFound.endTime > existingShift.startTime;

        if (!overlaps) continue;

        // Block only if both are Type B (auto-confirm)
        if (
            !ShiftFound.requiresPharmacistConfirmation &&
            !existingShift.requiresPharmacistConfirmation
        ) {
            conflictFound = true;
            conflictingShiftIds.push(existingShift._id);
        }
    }
    if (conflictFound) {
        return next(
            new ApiError(
                400,
                "Cannot apply: overlapping auto-confirm shifts found",
                { conflicts: conflictingShiftIds }
            )
        );
    }



    const applicationCreated = await Application.create(
        {
            pharmacistId: req.user.id,
            shiftId: shiftId,
            notes: notes
        }
    )
    ShiftFound.applications.push(applicationCreated._id);
    await ShiftFound.save();


    //#region  redis Related work here
    // 
    const pharmacyFound = await Pharmacy.findById(ShiftFound.pharmacyId);
    const pharmacistFound = await Pharmacist.findById(req.user.id);
    const jobBody = generateApplicationEmail({
        pharmacyName: pharmacyFound.name,
        pharmacistName: pharmacistFound.name,
        licenseNumber: pharmacistFound.licenseNumber,
        shiftDate: ShiftFound.date,
        notes,
        dashboardURL: ""
    });
    const job = {
        to: pharmacyFound.email,
        subject: "New Application recived for SHIFT", // we can show which shfit,by showing time range of it or date hmm
        body: jobBody,
    }
    await emailQueue.add("sendEmail", job);
    //#endregion
    res.json(new ApiResponse(200, applicationCreated, "Application Sent to the Shift's Pharmacy"))
    //#endregion
}

export { ApplyToShift, RegisterPharmacist, LoginPharmacist };