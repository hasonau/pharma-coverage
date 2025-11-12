import { ApiError } from "../utils/ApiError.js";
import Shift from "../models/Shift.model.js"
import Application from "../models/Application.model.js"
import Pharmacy from '../models/Pharmacy.model.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import Pharmacist from "../models/Pharmacist.model.js"
import { generateToken, verifyToken } from "../utils/jwt.js"
import { setTokeninCookie } from "../utils/cookie.js";
import { emailQueue } from "../queues/emailQueue.js";
import { conflictQueue } from "../queues/conflictQueue.js";
import { generateApplicationEmail } from "../utils/generateApplicationEmail.js";
import { getIO } from '../socket/socketServer.js'

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
    try {
        const { notes } = req.body;
        const { id } = req.user;
        const shiftId = req.params.shiftId;

        // 1️⃣ Find target shift
        const ShiftFound = await Shift.findById(shiftId);
        if (!ShiftFound)
            return next(new ApiError(404, "This shiftID doesn't exist in SHIFT Model"));
        if (ShiftFound.status !== "open")
            return next(new ApiError(404, "Shift is not open or has been closed"));

        // 2️⃣ Prevent duplicate active application
        const existingActive = await Application.findOne({
            shiftId,
            pharmacistId: id,
            status: { $in: ["applied", "offered", "accepted"] }
        });
        if (existingActive)
            return next(new ApiError(400, "Already applied"));

        // 3️⃣ Reuse withdrawn/rejected if exists, otherwise create new
        let application = await Application.findOne({
            shiftId,
            pharmacistId: id,
            status: { $in: ["withdrawn", "rejected"] }
        });

        if (application) {
            application.status = "applied";
            application.notes = notes;
            await application.save();
        } else {
            application = await Application.create({
                pharmacistId: id,
                shiftId,
                notes
            });
        }

        // 4️⃣ Link application to shift
        if (!ShiftFound.applications.includes(application._id)) {
            ShiftFound.applications.push(application._id);
            await ShiftFound.save();
        }

        // 5️⃣ Fire background conflict detection (async)
        await conflictQueue.add("detectConflicts", {
            pharmacistId: id,
            shiftId,
            action: "apply"
        });

        // 6️⃣ Queue pharmacy notification email
        const pharmacyFound = await Pharmacy.findById(ShiftFound.pharmacyId);
        const pharmacistFound = await Pharmacist.findById(id);

        if (pharmacyFound && pharmacistFound) {
            const jobBody = generateApplicationEmail({
                pharmacyName: pharmacyFound.name,
                pharmacistName: pharmacistFound.name,
                licenseNumber: pharmacistFound.licenseNumber,
                shiftDate: ShiftFound.date,
                notes,
                dashboardURL: ""
            });

            await emailQueue.add("sendEmail", {
                to: pharmacyFound.email,
                subject: "New Application received for SHIFT",
                body: jobBody
            });
        }
        const io = getIO();
        io.to(`pharmacy_${ShiftFound.pharmacyId}`).emit("newApplication", {
            pharmacistId: pharmacistFound._id,
            shiftId: ShiftFound._id,
            message: "New pharmacist applied for your shift."
        });
        // TEMP: Emit to pharmacist for testing
        io.to(`pharmacist_${id}`).emit("newApplication", {
            pharmacistId: pharmacistFound._id,
            shiftId: ShiftFound._id,
            message: "New pharmacist applied for your shift. (Test)"
        });
        // 7️⃣ Final response to pharmacist
        return res.json(
            new ApiResponse(200, application, "Application sent successfully (conflicts handled asynchronously)")
        );

    } catch (error) {
        next(error);
    }
};

const UnApplyShift = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const pharmacistId = req.user.id;

        // 1. Find the application
        const application = await Application.findById(applicationId).populate("shiftId");
        if (!application) return next(new ApiError(404, "Application not found"));

        // 2. Validate ownership
        if (application.pharmacistId.toString() !== pharmacistId)
            return next(new ApiError(403, "You can only withdraw your own applications"));

        // 3. Validate status
        const shift = application.shiftId;
        if (!shift) return next(new ApiError(404, "Associated shift not found"));

        if (
            application.status === "accepted" &&
            !shift.requiresPharmacistConfirmation
        ) {
            return next(new ApiError(
                400,
                "Cannot withdraw: Type B application is already accepted"
            ));
        }

        if (!["applied", "offered"].includes(application.status)) {
            return next(new ApiError(
                400,
                `Cannot withdraw application with status '${application.status}'`
            ));
        }

        // 4. Update application status to withdrawn
        application.status = "withdrawn";
        await application.save();

        // 5. Remove application from shift.applications array
        await Shift.findByIdAndUpdate(shift._id, {
            $pull: { applications: application._id }
        });

        // 6. Optional: enqueue notification email to pharmacy
        const pharmacy = await Pharmacy.findById(shift.pharmacyId);
        if (pharmacy) {
            const jobBody = generateApplicationEmail({
                pharmacyName: pharmacy.name,
                pharmacistName: req.user.name || "Pharmacist",
                licenseNumber: req.user.licenseNumber || "",
                shiftDate: shift.date,
                notes: application.notes,
                action: "withdrawn",
                dashboardURL: ""
            });
            const job = {
                to: pharmacy.email,
                subject: "Application Withdrawn",
                body: jobBody
            };
            await emailQueue.add("sendEmail", job);
        }
        const io = getIO();
        io.to(`pharmacy_${shift.pharmacyId}`).emit("applicationWithdrawn", {
            shiftId: shift._id,
            pharmacistId,
            message: "Pharmacist withdrew their application."
        });


        res.json(new ApiResponse(200, application, "Application withdrawn successfully"));

    } catch (error) {
        next(error);
    }
};
const switchShiftApplication = async (req, res, next) => {
    try {
        const { oldApplicationId, newShiftId } = req.body;
        const pharmacistId = req.user.id;

        // 1️⃣ Fetch old application
        const oldApplication = await Application.findById(oldApplicationId).populate("shiftId");
        if (!oldApplication) return next(new ApiError(404, "Old application not found"));

        // Validate ownership
        if (oldApplication.pharmacistId.toString() !== pharmacistId)
            return next(new ApiError(403, "You can only withdraw your own applications"));

        const oldShift = oldApplication.shiftId;
        if (!oldShift) return next(new ApiError(404, "Associated old shift not found"));

        // Check Type B accepted condition
        if (oldApplication.status === "accepted" && !oldShift.requiresPharmacistConfirmation) {
            return next(new ApiError(400, "Cannot switch: old Type B shift already accepted"));
        }

        // Check other valid statuses
        if (!["applied", "offered"].includes(oldApplication.status)) {
            return next(new ApiError(400, `Cannot switch old application with status '${oldApplication.status}'`));
        }

        // 2️⃣ Withdraw old application
        oldApplication.status = "withdrawn";
        await oldApplication.save();
        await Shift.findByIdAndUpdate(oldShift._id, { $pull: { applications: oldApplication._id } });

        // Optional: notify old shift pharmacy
        const oldPharmacy = await Pharmacy.findById(oldShift.pharmacyId);
        if (oldPharmacy) {
            const jobBody = generateApplicationEmail({
                pharmacyName: oldPharmacy.name,
                pharmacistName: req.user.name || "Pharmacist",
                licenseNumber: req.user.licenseNumber || "",
                shiftDate: oldShift.date,
                notes: oldApplication.notes,
                action: "withdrawn",
                dashboardURL: ""
            });
            await emailQueue.add("sendEmail", {
                to: oldPharmacy.email,
                subject: "Application Withdrawn",
                body: jobBody
            });
        }

        // 3️⃣ Attempt to apply to new shift
        const newShift = await Shift.findById(newShiftId);
        if (!newShift) return next(new ApiError(404, "New shift not found"));

        const existingApplication = await Application.findOne({
            pharmacistId,
            shiftId: newShiftId,
            status: { $in: ["applied", "offered", "accepted"] }
        });
        if (existingApplication) {
            // Rollback old application
            oldApplication.status = "applied";
            await oldApplication.save();
            oldShift.applications.push(oldApplication._id);
            await oldShift.save();
            return next(new ApiError(409, "Already applied to the new shift. Old shift restored"));
        }

        // Create new application
        const newApplication = await Application.create({
            pharmacistId,
            shiftId: newShiftId,
            status: "applied",
            notes: req.body.notes || ""
        });
        newShift.applications.push(newApplication._id);
        await newShift.save();

        // Optional: notify new shift pharmacy
        const newPharmacy = await Pharmacy.findById(newShift.pharmacyId);
        if (newPharmacy) {
            const jobBody = generateApplicationEmail({
                pharmacyName: newPharmacy.name,
                pharmacistName: req.user.name || "Pharmacist",
                licenseNumber: req.user.licenseNumber || "",
                shiftDate: newShift.date,
                notes: newApplication.notes,
                action: "applied",
                dashboardURL: ""
            });
            await emailQueue.add("sendEmail", {
                to: newPharmacy.email,
                subject: "New Application Received",
                body: jobBody
            });
        }
        const io = getIO();
        // Old shift
        io.to(`pharmacy_${oldShift.pharmacyId}`).emit("applicationWithdrawn", {
            shiftId: oldShift._id,
            pharmacistId,
            message: "Pharmacist switched from this shift."
        });
        // New shift
        io.to(`pharmacy_${newShift.pharmacyId}`).emit("newApplication", {
            shiftId: newShift._id,
            pharmacistId,
            message: "Pharmacist applied for this new shift."
        });


        res.status(200).json(new ApiResponse(
            200,
            newApplication,
            "Successfully switched application to the new shift"
        ));

    } catch (error) {
        // Attempt rollback if new application creation failed
        try {
            const oldApplication = await Application.findById(req.body.oldApplicationId);
            if (oldApplication && oldApplication.status === "withdrawn") {
                oldApplication.status = "applied";
                await oldApplication.save();
                const oldShift = await Shift.findById(oldApplication.shiftId);
                if (oldShift && !oldShift.applications.includes(oldApplication._id)) {
                    oldShift.applications.push(oldApplication._id);
                    await oldShift.save();
                }
            }
        } catch (rollbackError) {
            console.error("Rollback failed:", rollbackError);
        }

        next(new ApiError(500, "Switch failed. Old shift restored if possible."));
    }
};
const confirmOffer = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const pharmacistId = req.user.id;

        // 1️⃣ Find and validate
        const application = await Application.findById(applicationId).populate("shiftId");
        if (!application) throw new ApiError(404, "Application not found");

        if (application.pharmacistId.toString() !== pharmacistId)
            throw new ApiError(403, "You are not authorized to respond to this offer");

        const shift = application.shiftId;
        if (!shift) throw new ApiError(404, "Associated shift not found");
        if (application.status !== "offered")
            throw new ApiError(400, "Only offered applications can be confirmed");

        // 2️⃣ Mark accepted and fill shift
        application.status = "accepted";
        await application.save();

        shift.status = "filled";
        shift.confirmedPharmacistId = pharmacistId;
        await shift.save();

        // 3️⃣ Reject other applicants for this same shift
        await Application.updateMany(
            { shiftId: shift._id, _id: { $ne: application._id } },
            { $set: { status: "rejected" } }
        );

        // 4️⃣ Async conflict check
        await conflictQueue.add("detectConflicts", {
            pharmacistId,
            shiftId: shift._id,
            action: "confirm"
        });

        const io = getIO();
        io.to(`pharmacy_${shift.pharmacyId}`).emit("offerConfirmed", {
            shiftId: shift._id,
            pharmacistId,
            message: "Pharmacist confirmed the offer."
        });

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                application,
                "Offer confirmed successfully. Shift filled (Type A)."
            ));
    } catch (error) {
        next(error);
    }
};
const rejectOffer = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const pharmacistId = req.user.id;

        const application = await Application.findById(applicationId).populate("shiftId");
        if (!application) throw new ApiError(404, "Application not found");

        if (application.pharmacistId.toString() !== pharmacistId)
            throw new ApiError(403, "You are not authorized to respond to this offer");

        if (application.status !== "offered")
            throw new ApiError(400, "Only offered applications can be rejected");

        // 1️⃣ Mark this application as rejected
        application.status = "rejected";
        await application.save();

        const io = getIO();
        io.to(`pharmacy_${shift.pharmacyId}`).emit("applicationStatusUpdated", {
            shiftId: shift._id,
            pharmacistId,
            status: "offerRejected",
            message: "Pharmacist rejected the offer."
        });

        // 2️⃣ Keep shift open and other applicants untouched
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                application,
                "Offer rejected successfully. Shift remains open."
            ));

    } catch (error) {
        next(error);
    }
};



export { ApplyToShift, RegisterPharmacist, LoginPharmacist, UnApplyShift, switchShiftApplication, confirmOffer, rejectOffer };