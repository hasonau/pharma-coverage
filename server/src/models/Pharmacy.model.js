import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Pharmacy Schema 
const pharmacySchema = new mongoose.Schema({
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
    address: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
        // Optionally add regex validation for phone numbers later
    },
    role: {
        type: String,
        required: true,
        default: "pharmacy"
    }
}, { timestamps: true });


// Pre-save hook to hash password before saving
pharmacySchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
pharmacySchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);

export default Pharmacy;