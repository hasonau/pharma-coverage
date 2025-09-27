import Joi from 'joi';


const RegisterPharmacySchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().max(254).required(),
    password: Joi.string().min(6).max(50).required(),
    licenseNumber: Joi.string().max(30).required(),
    contactNumber: Joi.string().max(15).required(),
    address: Joi.string().max(100).required(),
    city: Joi.string().max(50).required(),
    country: Joi.string().max(50).required(),
});

const LoginPharmacySchema = Joi.object({
    email: Joi.string().email().max(254).required(),
    password: Joi.string().min(6).max(50).required(),
});

export { RegisterPharmacySchema, LoginPharmacySchema };