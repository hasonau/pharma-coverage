import Joi from "joi";

// Custom validation for ObjectId (24 hex chars)
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message("Invalid ObjectId");

const ApplyShiftSchema = Joi.object({
    notes: Joi.string().max(200).optional()
});

export { ApplyShiftSchema };
