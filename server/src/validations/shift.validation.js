import Joi from "joi";

const CreateShiftSchema = Joi.object({
    date: Joi.date().required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    hourlyRate: Joi.number().positive().required(),
    requirements: Joi.string().max(200).optional(),
    city: Joi.string().trim().required(),
    description: Joi.string().max(500).optional(),
    urgency: Joi.string().valid("normal", "urgent").default("normal"),
    shiftType: Joi.string().valid("regular", "emergency", "weekend").default("regular"),
    maxApplicants: Joi.number().min(0).default(0),
    requiresPharmacistConfirmation: Joi.boolean().default(true)
});
const UpdateShiftSchema = Joi.object({
    date: Joi.date().optional(),
    startTime: Joi.date().optional(),
    endTime: Joi.date().optional(),
    city: Joi.string().trim().required(),
    hourlyRate: Joi.number().positive().optional(),
    requirements: Joi.string().max(200).optional(),
    description: Joi.string().max(500).optional(),
    urgency: Joi.string().valid("normal", "urgent").default("normal"),
    shiftType: Joi.string().valid("regular", "emergency", "weekend").default("regular"),
    maxApplicants: Joi.number().min(0).default(0),
    status: Joi.string().valid("open", "closed").optional(),
});

export { CreateShiftSchema, UpdateShiftSchema };
