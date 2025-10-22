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

    if (applicationFound) return next(new ApiError(400, "Already applied"))
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