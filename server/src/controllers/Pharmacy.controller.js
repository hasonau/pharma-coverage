import Pharmacy from "../models/Pharmacy.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { generateToken, verifyToken } from "../utils/jwt.js"
import { setTokeninCookie } from "../utils/cookie.js"


const Login = async (req, res, next) => {

    // EMAIL AND PASSWORD,taken out from req.body
    const email = req.body.email;
    const password = req.body.password;

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
    // we get everything we require,we see what we require from model of pharmacy,right?
    // then we make new user using all that data,let's do that now
    const newPharmacyToBeRegistered = req.body;
    if (!newPharmacyToBeRegistered) throw new ApiError(404, "Send body with user");

    const alreadyEmailExists = await Pharmacy.findOne({ email: newPharmacyToBeRegistered.email });
    if (alreadyEmailExists) throw new ApiError(404, "Email already exists")

    // checking all required fields before trying to create new Pharmacy user
    if (!newPharmacyToBeRegistered.email) throw new ApiError(400, "Email not provided")
    if (!newPharmacyToBeRegistered.password) throw new ApiError(400, "password not provided")
    if (!newPharmacyToBeRegistered.name) throw new ApiError(400, "Name not provided")
    if (!newPharmacyToBeRegistered.licenseNumber) throw new ApiError(400, "LicenseNumber not provided")
    // if (!newPharmacyToBeRegistered.isVerified) throw new ApiError(404, "isverified not given")
    if (!newPharmacyToBeRegistered.contactNumber) throw new ApiError(404, "isverified not given")
    // if (!newPharmacyToBeRegistered.role) throw new ApiError(404, "isverified not given")



    const newPharmacy = await Pharmacy.create(
        {
            name: newPharmacyToBeRegistered.name,
            email: newPharmacyToBeRegistered.email,
            password: newPharmacyToBeRegistered.password,
            licenseNumber: newPharmacyToBeRegistered.licenseNumber,
            address: newPharmacyToBeRegistered.address,
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
    res.json(new ApiResponse(200, { name: newPharmacy.name, email: newPharmacy.email }, "Registration Successful"))

}
export { Login, RegisterPharmacy }