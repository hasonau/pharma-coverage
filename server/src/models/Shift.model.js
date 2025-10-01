import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacy",
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true // important for filtering by day
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    hourlyRate: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["open", "filled", "cancelled"],
        default: "open"
    },
    requirements: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    urgency: {
        type: String,
        enum: ["normal", "urgent"],
        default: "normal"
    },
    shiftType: {
        type: String,
        enum: ["regular", "emergency", "weekend"],
        default: "regular"
    },
    maxApplicants: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application"
    }],
    confirmedPharmacistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacist",
        default: null
    },
    notes: {
        type: String
    },
}, { timestamps: true });

// Compound index for conflict detection (date + times)
// Made for future logic of preventing overlapping shifts
shiftSchema.index({ date: 1, startTime: 1, endTime: 1 });
shiftSchema.index({ pharmacyId: 1 });


const Shift = mongoose.model("Shift", shiftSchema);
export default Shift;
