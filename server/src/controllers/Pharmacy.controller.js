import Pharmacy from "../models/Pharmacy.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { generateToken, verifyToken } from "../utils/jwt.js"
import { setTokeninCookie } from "../utils/cookie.js"


const Login = async (req, res, next) => {

    // EMAIL AND PASSWORD,taken out from req.body
    const { email, password } = req.body;

    // Extracting Pharmacy of that email provided
    const UserFound = await Pharmacy.findOne({ email })
    if (!UserFound) throw new ApiError(404, "Pharmacy not found with this email");

    // if userFound,we check if password by user is same as password in MONGODB
    const isPasswordCorrect = await UserFound.comparePassword(password)
    if (!isPasswordCorrect) throw new ApiError(401, "Wrong Password")

    // payload we use to generate token,are ID AND ROLE
    const payload = { id: UserFound._id, role: "pharmacy" };
    const token = generateToken(payload);
    console.log("Token : ", token)

    // setting token in cookie
    setTokeninCookie(res, token);
    res.json(new ApiResponse(200, "Login Succesfull"))

}

const RegisterPharmacy = async (req, res, next) => {

    const newPharmacyToBeRegistered = req.body;
    if (!newPharmacyToBeRegistered) throw new ApiError(404, "Send body with user");

    const alreadyEmailExists = await Pharmacy.findOne({ email: newPharmacyToBeRegistered.email });
    if (alreadyEmailExists) throw new ApiError(404, "Email already exists")


    const newPharmacy = await Pharmacy.create(
        {
            name: newPharmacyToBeRegistered.name,
            email: newPharmacyToBeRegistered.email,
            password: newPharmacyToBeRegistered.password,
            licenseNumber: newPharmacyToBeRegistered.licenseNumber,
            address: newPharmacyToBeRegistered.address,
            city: newPharmacyToBeRegistered.city,
            country: newPharmacyToBeRegistered.country,
            contactNumber: newPharmacyToBeRegistered.contactNumber,
            isVerified: newPharmacyToBeRegistered.isVerified,
            role: newPharmacyToBeRegistered.role
        }
    );
    const payload = { id: newPharmacy._id, role: "pharmacy" };
    const token = generateToken(payload);
    console.log("Token : ", token)

    // setting token in cookie
    setTokeninCookie(res, token);
    res.json(new ApiResponse(200, { name: newPharmacy.name, email: newPharmacy.email }, "Pharmacy Registrated"))

}
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