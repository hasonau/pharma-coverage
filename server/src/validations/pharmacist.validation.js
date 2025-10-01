import Joi from 'joi';

const RegisterPharmacistSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().max(254).required(),
    password: Joi.string().min(6).max(50).required(),
    licenseNumber: Joi.string().max(30).required(),
    contactNumber: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required(),
    addressLine: Joi.string().max(100).required(),
    city: Joi.string().max(50).required(),
    state: Joi.string().max(50).optional(),
    country: Joi.string().max(50).required(),
    postalCode: Joi.string().max(20).optional(),
    specialization: Joi.string().max(50).optional(),
    experience: Joi.number().min(0).optional()
});

const LoginPharmacistSchema = Joi.object({
    email: Joi.string().email().max(254).required(),
    password: Joi.string().min(6).max(50).required()
});

export { RegisterPharmacistSchema, LoginPharmacistSchema };
