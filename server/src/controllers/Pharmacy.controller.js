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
export { Login, RegisterPharmacy }