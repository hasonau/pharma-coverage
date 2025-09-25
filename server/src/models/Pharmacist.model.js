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
        // Used for verification logic with hashmap/array
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    specialization: {
        type: String,
        required: false,
        trim: true
        // Example: "Retail", "Hospital", "Clinical"
    },
    experience: {
        type: Number,
        required: false,
        min: 0
        // Number of years of practice
    },
    contactNumber: {
        type: String,
        required: true
        // Phone number for pharmacies to contact
    },
    role: {
        type: String,
        required: true,
        default: "pharmacist"
    }
}, { timestamps: true });

pharmacistSchema.pre("save", async function (next) {

    if (!this.isModified("password")) {
        return next();
    }
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
}

const Pharmacist = mongoose.model("Pharmacist", pharmacistSchema);
export default Pharmacist;