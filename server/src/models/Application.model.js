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
        enum: ["applied", "offered", "accepted", "rejected", "withdrawn"],
        default: "applied"
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

applicationSchema.index({ shiftId: 1, pharmacistId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
