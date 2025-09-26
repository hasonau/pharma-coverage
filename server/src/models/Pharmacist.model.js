import mongoose from "mongoose";
import bcrypt from "bcrypt";

const pharmacistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    specialization: {
        type: String,
        trim: true
    },
    experience: {
        type: Number,
        min: 0
    },
    contactNumber: {
        type: String,
        required: true
    },
    // New location fields
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    postalCode: { type: String },

    role: {
        type: String,
        required: true,
        default: "pharmacist"
    }
}, { timestamps: true });

pharmacistSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

pharmacistSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const Pharmacist = mongoose.model("Pharmacist", pharmacistSchema);
export default Pharmacist;
