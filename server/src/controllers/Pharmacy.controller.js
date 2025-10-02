import Pharmacy from "../models/Pharmacy.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { generateToken, verifyToken } from "../utils/jwt.js"
import { setTokeninCookie } from "../utils/cookie.js"
import Application from "../models/Application.model.js"
import Shift from "../models/Shift.model.js"

const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const UserFound = await Pharmacy.findOne({ email });
        if (!UserFound) return res.status(404).json({ message: "Pharmacy not found with this email" });

        const isPasswordCorrect = await UserFound.comparePassword(password);
        if (!isPasswordCorrect) return res.status(401).json({ message: "Wrong password" });

        const payload = { id: UserFound._id, role: "pharmacy" };
        const token = generateToken(payload);
        setTokeninCookie(res, token);

        res.json(new ApiResponse(200, "Login successful"));
    } catch (error) {
        // catches DB errors, bcrypt errors, or any other unexpected runtime errors
        next(error);
    }
};


const RegisterPharmacy = async (req, res, next) => {
    try {
        const newPharmacyToBeRegistered = req.body;
        if (!newPharmacyToBeRegistered) throw new ApiError(400, "Send body with user");

        const emailExists = await Pharmacy.findOne({ email: newPharmacyToBeRegistered.email });
        if (emailExists) return res.status(400).json({ message: "Email already exists" });

        const contactExists = await Pharmacy.findOne({ contactNumber: newPharmacyToBeRegistered.contactNumber });
        if (contactExists) return res.status(400).json({ message: "Contact number already in use" });

        const licenseExists = await Pharmacy.findOne({ licenseNumber: newPharmacyToBeRegistered.licenseNumber });
        if (licenseExists) return res.status(400).json({ message: "License number already exists" });

        const newPharmacy = await Pharmacy.create({
            name: newPharmacyToBeRegistered.name,
            email: newPharmacyToBeRegistered.email,
            password: newPharmacyToBeRegistered.password,
            licenseNumber: newPharmacyToBeRegistered.licenseNumber,
            address: newPharmacyToBeRegistered.address,
            city: newPharmacyToBeRegistered.city,
            country: newPharmacyToBeRegistered.country,
            contactNumber: newPharmacyToBeRegistered.contactNumber,
            isVerified: newPharmacyToBeRegistered.isVerified || false,
            role: newPharmacyToBeRegistered.role || "pharmacy"
        });

        const payload = { id: newPharmacy._id, role: "pharmacy" };
        const token = generateToken(payload);
        setTokeninCookie(res, token);

        res.json(new ApiResponse(200, { name: newPharmacy.name, email: newPharmacy.email }, "Pharmacy registered"));
    } catch (error) {
        // Catch race-condition duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        next(error);
    }
};

const AcceptApplication = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const pharmacyId = req.user.id; // logged-in pharmacy

        // 1. Find the application
        const application = await Application.findById(applicationId);
        if (!application) throw new ApiError(404, "Application not found");

        // 2. Find the related shift
        const shift = await Shift.findById(application.shiftId);
        if (!shift) throw new ApiError(404, "Shift not found");

        // 3. Authorization: check pharmacy owns this shift
        if (shift.pharmacyId.toString() !== pharmacyId) {
            throw new ApiError(403, "You are not authorized to manage this shift");
        }

        // 4. Check if shift already filled
        if (shift.status === "filled") {
            throw new ApiError(400, "This shift is already filled");
        }

        // 5. Accept this application
        application.status = "accepted";
        await application.save();

        // 6. Reject all other applications for the same shift
        await Application.updateMany(
            { shiftId: shift._id, _id: { $ne: applicationId } },
            { $set: { status: "rejected" } }
        );

        // 7. Update shift status
        shift.status = "filled";
        shift.confirmedPharmacistId = application.pharmacistId;
        await shift.save();

        // 8. Response
        res.json(new ApiResponse(200, { applicationId }, "Application accepted successfully"));
    } catch (error) {
        next(error);
    }
};
const RejectApplication = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const pharmacyId = req.user.id;

        // Find the application with shift populated
        const application = await Application.findById(applicationId).populate("shiftId");
        if (!application) {
            return next(new ApiError(404, "Application not found"));
        }

        // Ensure the pharmacy owns this shift
        if (application.shiftId.pharmacyId.toString() !== pharmacyId) {
            return next(new ApiError(403, "You are not allowed to reject applications for this shift"));
        }

        // If already accepted or rejected, no point in re-rejecting
        if (application.status !== "applied") {
            return next(new ApiError(400, `Application is already ${application.status}`));
        }

        // Mark this application as rejected
        application.status = "rejected";
        await application.save();

        res.json(new ApiResponse(200, application, "Application rejected successfully"));
    } catch (error) {
        next(error);
    }
};

export { Login, RegisterPharmacy, AcceptApplication, RejectApplication };