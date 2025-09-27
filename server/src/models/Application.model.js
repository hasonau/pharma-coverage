import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
        required: true,
        index: true
    },
    pharmacistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacist",
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ["applied", "accepted", "rejected"],
        default: "applied"
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
